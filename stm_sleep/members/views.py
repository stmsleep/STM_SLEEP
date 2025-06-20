from io import BytesIO
import matplotlib.pyplot as plt
from .models import DropboxToken
from datetime import timedelta
from django.utils import timezone
from django.shortcuts import redirect
import requests
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from .utils.summary import extract_summary_pdf
import traceback
import json
import dropbox
from dropbox.files import FolderMetadata, FileMetadata
from django.conf import settings
from rest_framework.views import APIView
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.response import Response
from django.contrib.auth import authenticate, get_user_model
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils.decorators import method_decorator
from .utils.refresh_token import get_dropbox_client
from .utils.convert_to_npz import *
from django.http import HttpResponse
import io
import time
import mne
import numpy as np
from django.http import HttpResponse
import os
import tempfile
from scipy.signal import butter, filtfilt
from django.core.serializers.json import DjangoJSONEncoder
import matplotlib
matplotlib.use("Agg")


def unauthorized_root(request):
    return HttpResponse(
        "<h1>401 Unauthorized</h1><p>This API is not meant for direct access.</p>",
        content_type="text/html",
        status=401
    )


User = get_user_model()


@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'detail': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            user = authenticate(
                request, username=user.username, password=password)

            if user is not None and user.is_active:
                request.session["user"] = user.email
                return Response({'detail': 'Login successful'}, status=status.HTTP_200_OK)
            else:
                return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        except User.DoesNotExist:
            username = email.split('@')[0]
            if User.objects.filter(username=username).exists():
                username = f"{username}_{User.objects.count()+1}"

            user = User.objects.create_user(
                username=username, email=email, password=password)

            # Create Dropbox folder for new user
            dbx = get_dropbox_client()
            folder_path = f"/STM-Sleep/{user.username}"
            try:
                dbx.files_create_folder_v2(folder_path)
            except dropbox.exceptions.ApiError as e:
                if e.error.is_path() and e.error.get_path().reason.is_conflict():
                    pass  # folder already exists
                else:
                    return Response({'error': f'Dropbox error: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            request.session["user"] = user.email
            request.session.modified = True
            return Response({'detail': 'User created and logged in'}, status=status.HTTP_201_CREATED)


@csrf_exempt
def list_user_folders(request):
    print(request.session.keys())
    user = request.session.get("user")
    print(user)

    if not user:
        print("No user found")
        return JsonResponse({'error': "Error"}, status=500)

    try:
        dbx = get_dropbox_client()

        print("Printing root folder entries...")
        # result = dbx.files_list_folder("")
        result = dbx.files_list_folder(f"/STM-Sleep/{user}")
        print(result)
        user_folders = []

        for entry in result.entries:
            print(entry.name)
            if isinstance(entry, FolderMetadata):
                user_folders.append(entry.name)

        return JsonResponse({'folders': user_folders})

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def set_active_user(request):
    if request.method == 'POST':

        try:
            data = json.loads(request.body)
            folder = data.get('folder_clicked')
            print(folder)
            if not folder:
                return JsonResponse({'error': 'Username is required'}, status=400)

            dbx = get_dropbox_client()
            user = request.session["user"]
            base_dir = f"/STM-Sleep/{user}/"
            base_dir += folder

            result = dbx.files_list_folder(base_dir)

            folder_files = []
            request.session['files'] = {
                "pdf_summary": "",
                "heart_rate_csv": "",
                "eog_txt": "",
                "ecg_txt": "",
                "eeg_edf": "",
            }

            for entry in result.entries:
                print(entry.name)
                if isinstance(entry, FileMetadata):
                    folder_files.append(entry.name)
                    if (entry.name.startswith('EMAY SpO2') and entry.name.endswith('.pdf')):
                        request.session['files']["pdf_summary"] = base_dir + \
                            "/" + entry.name

                    if (entry.name.startswith('EMAY SpO2') and entry.name.endswith('.npz')):
                        request.session['files']["heart_rate_csv"] = base_dir + \
                            "/" + entry.name

                    if (entry.name.endswith('_eog_000.npz')):
                        request.session['files']["eog_txt"] = base_dir + \
                            "/" + entry.name

                    if (entry.name.endswith("ecg_000.npz")):
                        request.session['files']["ecg_txt"] = base_dir + \
                            "/" + entry.name
                    if (entry.name.startswith('STME') and entry.name.endswith(".edf")):
                        request.session['files']["eeg_edf"] = base_dir + \
                            "/" + entry.name

            # print(request.session["files"])
            print("Completed")

            # Store in session
            request.session.modified = True

            return JsonResponse({
                'message': 'Session updated',
            }, status=200)

        except Exception as e:
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=400)


CHUNK_SIZE = 50 * 1024 * 1024  # 50 MB

# -------------------- Dropbox Chunk Upload --------------------


def upload_large_file(dbx, path, file_bytes):
    upload_session_start_result = dbx.files_upload_session_start(
        file_bytes.read(CHUNK_SIZE))
    cursor = dropbox.files.UploadSessionCursor(
        session_id=upload_session_start_result.session_id,
        offset=file_bytes.tell()
    )
    commit = dropbox.files.CommitInfo(
        path=path, mode=dropbox.files.WriteMode.overwrite)

    while file_bytes.tell() < len(file_bytes.getvalue()):
        if (len(file_bytes.getvalue()) - file_bytes.tell()) <= CHUNK_SIZE:
            dbx.files_upload_session_finish(
                file_bytes.read(CHUNK_SIZE), cursor, commit)
        else:
            dbx.files_upload_session_append_v2(
                file_bytes.read(CHUNK_SIZE), cursor)
            cursor.offset = file_bytes.tell()

# -------------------- NPZ Saver --------------------


def save_npz_to_dropbox(dbx, np_data_dict, dropbox_path, threshold=150 * 1024 * 1024):
    try:
        npz_bytes = io.BytesIO()
        np.savez_compressed(npz_bytes, **np_data_dict)
        npz_bytes.seek(0)

        file_size = len(npz_bytes.getvalue())

        if file_size > threshold:
            print(
                f"📦 Large .npz ({file_size / (1024*1024):.2f} MB) — using chunked upload")
            upload_large_file(dbx, dropbox_path, npz_bytes)
        else:
            print(
                f"📦 Uploading .npz ({file_size / (1024*1024):.2f} MB) directly")
            dbx.files_upload(npz_bytes.getvalue(), dropbox_path,
                             mode=dropbox.files.WriteMode.overwrite)

        print(f"✅ Saved to Dropbox: {dropbox_path}")

    except Exception as e:
        print(f"❌ Failed to upload .npz to Dropbox: {e}")
        traceback.print_exc()


@csrf_exempt
def upload_folder(request):
    user = request.session.get("user")
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=400)
    if not user:
        return JsonResponse({'error': 'User not authenticated'}, status=400)

    try:
        dbx = get_dropbox_client()
        file_count = int(request.POST.get("file_count", 0))

        for i in range(file_count):
            file_key = f"files_{i}"
            path_key = f"paths_{i}"

            if file_key not in request.FILES or path_key not in request.POST:
                continue

            file_obj = request.FILES[file_key]
            print("File Object :", file_obj)
            rel_path = request.POST[path_key]
            filename = file_obj.name
            print(filename)
            full_dropbox_path = f"/STM-Sleep/{user}/{rel_path}"
            file_bytes = file_obj.read()
            file_stream = io.BytesIO(file_bytes)
            npz_data = None
            if filename.endswith(".pdf"):
                print(f"Uploading PDF: {full_dropbox_path}")
                if len(file_bytes) > 150 * 1024 * 1024:
                    upload_large_file(dbx, full_dropbox_path,
                                      io.BytesIO(file_bytes))
                else:
                    dbx.files_upload(file_bytes, full_dropbox_path,
                                     mode=dropbox.files.WriteMode.overwrite)

            elif filename.endswith(".csv") or filename.endswith(".txt"):
                print(f"Preprocessing {filename} to NPZ")
                content_str = file_bytes.decode("utf-8")

                if filename.startswith("EMAY SpO2") and filename.endswith(".csv"):
                    npz_data = process_heart_to_npz(io.StringIO(content_str))
                elif filename.endswith("_eog_000.txt"):
                    npz_data = process_eog_to_npz(io.StringIO(content_str))
                elif filename.endswith("_ecg_000.txt"):
                    npz_data = process_ecg_to_npz(io.StringIO(content_str))
                else:
                    print(f"Skipping unrecognized data file: {filename}")
                    continue

                npz_path = full_dropbox_path.rsplit(".", 1)[0] + ".npz"
                save_npz_to_dropbox(dbx, npz_data, npz_path)

            elif filename.startswith("STME") and filename.endswith(".edf"):
                print(
                    f"📤 Uploading {filename} as EDF to Dropbox without preprocessing...")

                try:
                    from io import BytesIO

                    # Wrap the file_bytes in BytesIO so it can be read in chunks
                    file_buffer = BytesIO(file_bytes)

                    # Upload using your large file uploader
                    upload_large_file(dbx, full_dropbox_path, file_buffer)

                    print(f"✅ Uploaded EDF file: {full_dropbox_path}")

                except Exception as e:
                    print(f"❌ Failed to upload EDF file: {e}")

        return JsonResponse({'message': 'Folder uploaded successfully'})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def heart_rate(request):

    try:
        active_folder = request.session.get('files')
        if not active_folder or 'heart_rate_csv' not in active_folder:
            return JsonResponse({'error': 'Missing Dropbox file info'}, status=400)

        dbx = get_dropbox_client()
        link = dbx.files_get_temporary_link(
            active_folder['heart_rate_csv']).link
        return JsonResponse({"url": link})

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


def process_eog(request):

    try:
        active_folder = request.session.get('files')
        print(active_folder)
        if not active_folder or 'eog_txt' not in active_folder:
            return JsonResponse({'error': 'Missing Dropbox file info'}, status=400)

        # return response
        dbx = get_dropbox_client()
        link = dbx.files_get_temporary_link(active_folder['eog_txt']).link
        return JsonResponse({"url": link})

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def process_ecg(request):

    try:
        active_folder = request.session.get('files')
        if not active_folder or 'ecg_txt' not in active_folder:
            return JsonResponse({'error': 'Missing Dropbox file info'}, status=400)

        dbx = get_dropbox_client()
        link = dbx.files_get_temporary_link(active_folder['ecg_txt']).link
        return JsonResponse({"url": link})

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


def bandpass_filter(signal, lowcut, highcut, fs, order=4):
    nyquist = 0.5 * fs
    low = lowcut / nyquist
    high = highcut / nyquist
    b, a = butter(order, [low, high], btype='band')
    return filtfilt(b, a, signal)


@csrf_exempt
def process_eeg(request, channel_name):
    # active_folder = request.session.get('files')
    # if active_folder:
    #     try:
    #         eeg_edf_path = active_folder['eeg_edf']
    #         dbx = get_dropbox_client()

    #         # Download EDF from Dropbox
    #         metadata, res = dbx.files_download(eeg_edf_path)
    #         edf_bytes = res.content

    #         # Write bytes to temporary file
    #         with tempfile.NamedTemporaryFile(delete=False, suffix=".edf") as tmp_file:
    #             tmp_file.write(edf_bytes)
    #             tmp_file_path = tmp_file.name

    #         # Load EDF from temp file
    #         raw = mne.io.read_raw_edf(
    #             tmp_file_path, preload=True, verbose=False)

    #         # Clean up: optional (you can delete manually after if needed)
    #         os.unlink(tmp_file_path)

    #         # Select desired channels
    #         # ['EEG Fpz-Cz']  # or more:
    #         bands = {
    #             'delta': (0.5, 4),
    #             'theta': (4, 8),
    #             'alpha': (8, 13),
    #             'beta': (13, 30),
    #             'gamma': (30, 45),
    #         }

    #         raw.pick_channels([channel_name])
    #         sf = raw.info['sfreq']
    #         print("SAMPLING FREQUENCY :", sf)
    #         signal, times = raw.get_data(return_times=True)
    #         print("Signal:", signal)
    #         print("SIGNAL INDEX 0 : ", signal[0])

    #         bands_data = {}
    #         for band_name, (low, high) in bands.items():
    #             filtered = bandpass_filter(signal, low, high, sf)
    #             # convert NumPy to list for JSON
    #             bands_data[band_name] = filtered.tolist()
    #             # bands_data[band_name] = np.asarray(
    #             #     filtered).flatten().astype(float).tolist()
    #         # Prepare response

    #         print("Times :", times)

    #         return HttpResponse(
    #             json.dumps({
    #                 "channel": channel_name,
    #                 "sampling_rate": float(sf),
    #                 "signal": signal[0].tolist(),
    #                 "times": times.tolist(),
    #                 "bands": bands_data
    #             }, cls=DjangoJSONEncoder),
    #             content_type="application/json"
    #         )

    #     except Exception as e:
    #         traceback.print_exc()
    #         return JsonResponse({"error": str(e)}, status=500)
    # active_folder = request.session.get('files')
    # username = request.session.get('user')
    # if active_folder:
    #     try:
    #         eeg_edf_path = active_folder['eeg_edf']
    #         dbx = get_dropbox_client()

    #         # Download EDF from Dropbox
    #         metadata, res = dbx.files_download(eeg_edf_path)
    #         edf_bytes = res.content

    #         # Temp file to read EDF
    #         with tempfile.NamedTemporaryFile(delete=False, suffix=".edf") as tmp_file:
    #             tmp_file.write(edf_bytes)
    #             tmp_file_path = tmp_file.name

    #         raw = mne.io.read_raw_edf(
    #             tmp_file_path, preload=True, verbose=False)
    #         os.unlink(tmp_file_path)

    #         if channel_name not in raw.ch_names:
    #             return JsonResponse({"error": f"Channel '{channel_name}' not found"}, status=400)

    #         raw.pick_channels([channel_name])
    #         sf = raw.info['sfreq']
    #         signal, times = raw.get_data(return_times=True)
    #         signal = signal[0]
    #         times = times

    #         # 📁 Dropbox caching: check if band image exists
    #         plot_dropbox_path = f"/STM-Sleep/{username}/eeg_bands/{channel_name}_bands.png"
    #         band_image_link = None

    #         try:
    #             # Check if file already exists
    #             dbx.files_get_metadata(plot_dropbox_path)

    #             # If exists, generate direct link
    #             shared_link_metadata = dbx.sharing_create_shared_link_with_settings(
    #                 plot_dropbox_path)
    #             band_image_link = shared_link_metadata.url.replace(
    #                 "?dl=0", "?raw=1")

    #         except dropbox.exceptions.ApiError:
    #             # File doesn't exist – generate and upload

    #             bands = {
    #                 'delta': (0.5, 4),
    #                 'theta': (4, 8),
    #                 'alpha': (8, 13),
    #                 'beta': (13, 30),
    #                 'gamma': (30, 45),
    #             }

    #             fig, axs = plt.subplots(
    #                 len(bands), 1, figsize=(12, 8), sharex=True)
    #             fig.suptitle(f"Frequency Bands - {channel_name}", fontsize=14)

    #             for idx, (band_name, (low, high)) in enumerate(bands.items()):
    #                 filtered = bandpass_filter(signal, low, high, sf)
    #                 axs[idx].plot(times, filtered, linewidth=0.8)
    #                 axs[idx].set_title(
    #                     f"{band_name.capitalize()} ({low}-{high} Hz)")
    #                 axs[idx].set_ylabel("µV")
    #                 axs[idx].grid(True)

    #             axs[-1].set_xlabel("Time (s)")
    #             plt.tight_layout(rect=[0, 0.03, 1, 0.95])

    #             buf = BytesIO()
    #             plt.savefig(buf, format="png")
    #             plt.close(fig)
    #             buf.seek(0)

    #             dbx.files_upload(buf.read(), plot_dropbox_path,
    #                              mode=dropbox.files.WriteMode.overwrite)

    #             shared_link_metadata = dbx.sharing_create_shared_link_with_settings(
    #                 plot_dropbox_path)
    #             band_image_link = shared_link_metadata.url.replace(
    #                 "?dl=0", "?raw=1")

    #         return JsonResponse({
    #             "channel": channel_name,
    #             "sampling_rate": float(sf),
    #             "signal": signal.astype(float).tolist(),
    #             "times": times.astype(float).tolist(),
    #             "bands_image": band_image_link
    #         })

    #     except Exception as e:
    #         traceback.print_exc()
    #         return JsonResponse({"error": str(e)}, status=500)

    # return JsonResponse({"error": "No EEG session folder found"}, status=400)
    active_folder = request.session.get('files')
    if not active_folder:
        return JsonResponse({"error": "No active folder in session"}, status=400)

    try:
        eeg_edf_path = active_folder['eeg_edf']
        dbx = get_dropbox_client()

        # Step 1: Download EDF
        _, res = dbx.files_download(eeg_edf_path)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".edf") as tmp_file:
            tmp_file.write(res.content)
            tmp_file_path = tmp_file.name

        raw = mne.io.read_raw_edf(tmp_file_path, preload=True, verbose=False)
        os.unlink(tmp_file_path)

        # mne>=1.4+ uses .pick() instead of pick_channels
        raw.pick([channel_name])
        sf = raw.info['sfreq']
        signal, times = raw.get_data(return_times=True)

        # Step 2: Frequency Bands
        bands = {
            'delta': (0.5, 4),
            'theta': (4, 8),
            'alpha': (8, 13),
            'beta': (13, 30),
            'gamma': (30, 45),
        }

        bands_data = {}
        for band_name, (low, high) in bands.items():
            filtered = bandpass_filter(signal, low, high, sf)
            bands_data[band_name] = filtered.tolist()

        # Step 3: Generate and Upload Band Image
        user_email = request.session.get('user')
        plot_dropbox_path = f"/STM-Sleep/{user_email}/{channel_name}_bands.png"

        # If image doesn't exist, generate and upload
        try:
            dbx.files_get_metadata(plot_dropbox_path)
        except Exception:
            fig, axs = plt.subplots(
                len(bands_data), 1, figsize=(12, 8), sharex=True)
            if len(bands_data) == 1:
                axs = [axs]
            for i, (band, data) in enumerate(bands_data.items()):
                axs[i].plot(times, data[0], label=band, linewidth=0.5)
                axs[i].set_title(f"{band.upper()} Band")
                axs[i].legend()
            axs[-1].set_xlabel("Time (s)")
            fig.tight_layout()

            buf = io.BytesIO()
            plt.savefig(buf, format="png")
            plt.close(fig)
            buf.seek(0)

            dbx.files_upload(buf.read(), plot_dropbox_path,
                             mode=dropbox.files.WriteMode.overwrite)

        # Step 4: Get public link (safe)
        try:
            shared_link_metadata = dbx.sharing_create_shared_link_with_settings(
                plot_dropbox_path)
        except dropbox.exceptions.ApiError as e:
            if (e.error.is_shared_link_already_exists()
                    or "shared_link_already_exists" in str(e).lower()):
                links = dbx.sharing_list_shared_links(
                    path=plot_dropbox_path).links
                if links:
                    shared_link_metadata = links[0]
                else:
                    raise e
            else:
                raise e
        if not shared_link_metadata:
            print("No shared link metadata available!")
        else:
            print("IMAGE LINK:", shared_link_metadata.url.replace("?dl=0", "?raw=1"))

        band_image_link = shared_link_metadata.url
        if "dl=0" in band_image_link:
            band_image_link = band_image_link.replace("dl=0", "raw=1")
        else:
            band_image_link += "?raw=1"
        print("IMAGE LINK:", band_image_link)
        return JsonResponse({
            "channel": channel_name,
            "sampling_rate": sf,
            "signal": signal[0].tolist(),
            "times": times.tolist(),
            "band_plot_url": band_image_link  # pass image link only, not raw band data
        }, safe=False)

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def load_summary_pdf(request):
    active_folder = request.session.get('files')
    if active_folder:
        try:
            pdf_path = active_folder['pdf_summary']
            result = extract_summary_pdf(pdf_path)
            return JsonResponse(result)
        except Exception as e:
            traceback.print_exc()
            return JsonResponse({"Error": str(e)}, status=500)


# Dropbox token creation

# https://www.dropbox.com/oauth2/authorize?client_id=YOUR_APP_KEY&response_type=code&redirect_uri=YOUR_REDIRECT_URI&token_access_type=offline
# this is url to get refresh token at first


def dropbox_oauth_callback(request):
    code = request.GET.get('code')
    if not code:
        return HttpResponse("No code provided", status=400)

    url = "https://api.dropbox.com/oauth2/token"
    data = {
        "code": code,
        "grant_type": "authorization_code",
        "client_id": settings.DROPBOX_APP_KEY,
        "client_secret": settings.DROPBOX_APP_SECRET,
        "redirect_uri": "http://127.0.0.1:8000/",
    }

    response = requests.post(url, data=data)
    if response.status_code == 200:
        tokens = response.json()
        access_token = tokens['access_token']
        refresh_token = tokens['refresh_token']
        expires_in = tokens.get('expires_in', 14400)

        expires_at = timezone.now() + timedelta(seconds=expires_in)

        DropboxToken.objects.update_or_create(
            id=1,
            defaults={
                'access_token': access_token,
                'refresh_token': refresh_token,
                'expires_at': expires_at
            }
        )

        return HttpResponse("Dropbox tokens saved successfully.")
    else:
        return HttpResponse(f"Error: {response.text}", status=500)
