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
            request.session['folder_name'] = folder
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
    active_folder = request.session.get('files')
    if not active_folder:
        return JsonResponse({"error": "No active folder in session"}, status=400)

    try:
        eeg_edf_path = active_folder['eeg_edf']
        dbx = get_dropbox_client()

        user_email = request.session.get('user')
        folder_name = request.session.get('folder_name')
        plot_path = f"/STM-Sleep/{user_email}/{folder_name}/{channel_name}_bands.png"
        npz_path = f"/STM-Sleep/{user_email}/{folder_name}/{channel_name}_eeg.npz"

        # Check if both files already exist
        try:
            dbx.files_get_metadata(plot_path)
            dbx.files_get_metadata(npz_path)

            band_link = dbx.files_get_temporary_link(plot_path).link
            npz_link = dbx.files_get_temporary_link(npz_path).link

            return JsonResponse({
                "channel": channel_name,
                "sampling_rate": 256,  # optional default
                "band_plot_url": band_link,
                "npz_link": npz_link,
            })
        except dropbox.exceptions.ApiError:
            pass  # One or both files missing, proceed to generate

        # Download EDF
        _, res = dbx.files_download(eeg_edf_path)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".edf") as tmp_file:
            tmp_file.write(res.content)
            tmp_file_path = tmp_file.name

        raw = mne.io.read_raw_edf(tmp_file_path, preload=True, verbose=False)
        os.unlink(tmp_file_path)

        raw.pick([channel_name])
        sf = raw.info['sfreq']
        signal, times = raw.get_data(return_times=True)

        # ----- Generate band plot -----
        bands = {
            'delta': (0.5, 4),
            'theta': (4, 8),
            'alpha': (8, 13),
            'beta': (13, 30),
            'gamma': (30, 45),
        }

        fig, axs = plt.subplots(len(bands), 1, figsize=(12, 8), sharex=True)
        if len(bands) == 1:
            axs = [axs]

        for i, (band, (low, high)) in enumerate(bands.items()):
            filtered = bandpass_filter(signal, low, high, sf)
            axs[i].plot(times, filtered[0], label=band, linewidth=0.5)
            axs[i].set_title(f"{band.upper()} Band")
            axs[i].legend()

        axs[-1].set_xlabel("Time (s)")
        fig.tight_layout()

        buf = io.BytesIO()
        plt.savefig(buf, format="png")
        plt.close(fig)
        buf.seek(0)

        dbx.files_upload(buf.read(), plot_path, mode=dropbox.files.WriteMode.overwrite)

        # ----- Upload NPZ -----
        npz_buf = io.BytesIO()
        np.savez_compressed(npz_buf, signal=signal[0], times=times, sampling_rate=sf)
        npz_buf.seek(0)

        dbx.files_upload(npz_buf.read(), npz_path, mode=dropbox.files.WriteMode.overwrite)

        band_link = dbx.files_get_temporary_link(plot_path).link
        npz_link = dbx.files_get_temporary_link(npz_path).link

        return JsonResponse({
            "channel": channel_name,
            "sampling_rate": sf,
            "band_plot_url": band_link,
            "npz_link": npz_link,
        })

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











import os
import json
import shlex
import tempfile
import subprocess
import traceback

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST


import os
import json
import shlex
import tempfile
import subprocess
import traceback

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST



# @csrf_exempt
# @require_POST
# def jarvis(request):
#     try:
#         active_folder = request.session.get('files')
#         if not active_folder or 'eeg_edf' not in active_folder:
#             return JsonResponse({"error": "No EDF path found in session"}, status=400)

#         data = json.loads(request.body)
#         channel_name = data.get("channel_name")
#         print(channel_name)
#         sf = int(data.get("sfreq", 100))
#         ssh_cmd = data.get("ssh_cmd")

#         if not all([channel_name, sf, ssh_cmd]):
#             return JsonResponse({"error": "Missing required fields"}, status=400)

#         # Step 1: Download EDF from Dropbox
#         dropbox_path = active_folder['eeg_edf']
#         edf_filename = os.path.basename(dropbox_path)  # e.g., 'Recording_xyz.edf'
#         dbx = get_dropbox_client()

#         try:
#             _, res = dbx.files_download(dropbox_path)
#         except Exception as e:
#             return JsonResponse({"error": f"Failed to download EDF from Dropbox: {e}"}, status=404)

#         with tempfile.NamedTemporaryFile(delete=False, suffix=".edf") as tmp_file:
#             tmp_file.write(res.content)
#             local_edf_path = tmp_file.name

#         # Step 2: SCP to Jarvis
#         # Make sure both local path and remote target are properly quoted
#        # 2. SCP to Jarvis server
#         remote_filename = edf_filename.replace(" ", "_")  # optional sanitization'''
        
#         remote_path = f"/home/Model_Jarvis/Datasets/EDF Files"
#         '''{remote_filename}'''
#         scp_cmd = [
#             "scp",
#             "-P", "11514",
#             local_edf_path,
#             f"root@sshb.jarvislabs.ai:{remote_path}"
#         ]

#         # subprocess.run(scp_cmd, check=True)

#         # Step 3: SSH into Jarvis and run prediction
#         install_cmd = (
#             "cd /home/Model_Jarvis/Codes && "
#             "pip install mne timm pywavelets torchsummary"
#         )
#         quoted_channel = shlex.quote(channel_name)
#         quoted_filename = shlex.quote("SC4122E0-PSG.edf")
#         run_cmd = (
#             f"cd /home/Model_Jarvis/Codes && "
#             f"python init.py run sf={sf} channel_name={quoted_channel} testing_subjects={quoted_filename}"
#         )

#         # Combine both commands using '&&' so install runs first
#         remote_cmd = f"{install_cmd} && {run_cmd}"

#         # Full SSH command
#         ssh_full_cmd = f'{ssh_cmd} "{remote_cmd}"'
        
#         #"shlex.quote(edf_filename)"""
#         # remote_cmd = (
#         #     f"cd ../ && cd home/Model_Jarvis/Codes && "
#         #     f"python init.py run sf={sf} channel_name={quoted_channel} testing_subjects={quoted_filename}"
#         # )
#         ssh_full_cmd = f'{ssh_cmd} "{remote_cmd}"'

#         process = subprocess.Popen(
#             ssh_full_cmd,
#             shell=True,
#             stdout=subprocess.PIPE,
#             stderr=subprocess.STDOUT,
#             text=True,
#             encoding="utf-8",
#             errors="ignore"
#         )

#         prediction = None
#         prediction = None
#         while True:
#             line = process.stdout.readline()
#             if not line:
#                 break
#             print(f"🔍 Received line: {line.strip()}")  # Add this

#             if line.strip().startswith("[") and line.strip().endswith("]"):
#                 try:
#                     prediction = eval(line.strip())
#                 except Exception as e:
#                     print(f"⚠️ Eval failed: {e}")
#                     continue


#         process.wait()

#         if prediction is None:
#             return JsonResponse({"error": "Prediction not found in output"}, status=500)

#         return JsonResponse({"prediction": prediction})

#     except Exception as e:
#         traceback.print_exc()
#         return JsonResponse({"error": str(e)}, status=500)


"""
@csrf_exempt
@require_POST
def jarvis(request):
    try:
        import traceback
        import shlex
        import subprocess
        import json
        from django.http import JsonResponse

        # Ensure session has EEG file path
        active_folder = request.session.get('files')
        if not active_folder or 'eeg_edf' not in active_folder:
            return JsonResponse({"error": "No EDF path found in session"}, status=400)

        data = json.loads(request.body)
        ssh_cmd = data.get("ssh_cmd")
        sf = int(data.get("sfreq", 100))
        channel_name = data.get("channel_name", "EEG Fpz-Cz")
        selected_subjects = data.get("selected_subjects", ["SC4122E0"])
        testing_subjects = data.get("testing_subjects", ["SC4122E0-PSG"])

        if not ssh_cmd:
            return JsonResponse({"error": "Missing SSH command"}, status=400)

        # Prepare commands
        install_cmd = (
            "cd /home/Model_Jarvis/Codes && "
            "pip install mne timm pywavelets torchsummary"
        )

        quoted_channel = shlex.quote(channel_name)
        quoted_subjects = shlex.quote(", ".join(selected_subjects))
        quoted_testing = shlex.quote(testing_subjects[0])

        cwt_cmd = (
            f"cd /home/Model_Jarvis/Codes && "
            f"python init.py cwt sf={sf} channel_name={quoted_channel} selected_subjects={quoted_subjects}"
        )

        run_cmd = (
            f"cd /home/Model_Jarvis/Codes && "
            f"python init.py run sf={sf} channel_name={quoted_channel} testing_subjects={quoted_testing}"
        )

        remote_cmd = f"{install_cmd} && {cwt_cmd} && {run_cmd}"
        ssh_full_cmd = f'{ssh_cmd} "{remote_cmd}"'

        # Run SSH Process
        process = subprocess.Popen(
            ssh_full_cmd,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="ignore"
        )

        prediction = None
        while True:
            line = process.stdout.readline()
            if not line:
                break
            print(f"🔍 {line.strip()}")

            # Try to parse prediction line
            if line.strip().startswith("[") and line.strip().endswith("]"):
                try:
                    prediction = eval(line.strip())
                except Exception as e:
                    print(f"⚠️ Eval failed: {e}")
                    continue

        process.wait()

        if prediction is None:
            return JsonResponse({"error": "Prediction not found in output"}, status=500)

        return JsonResponse({"prediction": prediction})

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)

"""


# @csrf_exempt
# @require_POST
# def jarvis(request):
#     try:
#         import os
#         import json
#         import shlex
#         import subprocess
#         import tempfile
#         import traceback
#         from django.http import JsonResponse

#         # ✅ 1. Get session + params
#         active_folder = request.session.get('files')
#         if not active_folder or 'eeg_edf' not in active_folder:
#             return JsonResponse({"error": "No EDF path found in session"}, status=400)

#         data = json.loads(request.body)
#         ssh_cmd = data.get("ssh_cmd")
#         sf = int(data.get("sfreq", 100))
#         channel_name = data.get("channel_name", "EEG Fpz-Cz")

#         if not ssh_cmd:
#             return JsonResponse({"error": "Missing SSH command"}, status=400)

#         print("STEP 1 ✅ Got request:", ssh_cmd, sf, channel_name)

#         # ✅ 2. Download EDF file from Dropbox
#         dropbox_path = active_folder['eeg_edf']
#         edf_filename = os.path.basename(dropbox_path).replace(" ", "_")
#         dbx = get_dropbox_client()
#         try:
#             _, res = dbx.files_download(dropbox_path)
#             print(f"STEP 2 ✅ Downloaded EDF from Dropbox: {dropbox_path}")
#         except Exception as e:
#             return JsonResponse({"error": f"Failed to download from Dropbox: {e}"}, status=500)

#         with tempfile.NamedTemporaryFile(delete=False, suffix=".edf") as tmp_file:
#             tmp_file.write(res.content)
#             local_edf_path = tmp_file.name
#             print(f"STEP 2 ✅ Saved local EDF: {local_edf_path}")

#         # ✅ 3. Upload EDF to remote Jarvis  
#         remote_dir = "/home/Model_Jarvis/Datasets/EDF Files"
#         remote_file_path = f"{remote_dir}/{edf_filename}"

#         mkdir_cmd = f'{ssh_cmd} "mkdir -p \\"{remote_dir}\\""'
#         subprocess.run(mkdir_cmd, shell=True, check=True)
#         print("STEP 3 ✅ Created remote dir if needed")

#         scp_cmd = [
#             "scp",
#             "-P", "11014",
#             local_edf_path,
#             f'root@sshc.jarvislabs.ai:{remote_file_path}'
#         ]
#         subprocess.run(scp_cmd, check=True)
#         print("STEP 3 ✅ Uploaded EDF to Jarvis:", remote_file_path)

#         # ✅ 4. Build SSH prediction commands
#         install_cmd = (
#             "cd /home/Model_Jarvis/Codes && "
#             "pip install mne timm pywavelets torchsummary"
#         )
#         quoted_channel = shlex.quote(channel_name)
#         base_subject = edf_filename.replace('.edf', '')
#         quoted_subject = shlex.quote(base_subject)

#         cwt_cmd = (
#             f"cd /home/Model_Jarvis/Codes && "
#             f"python init.py cwt sf={sf} channel_name={quoted_channel} selected_subjects={quoted_subject}"
#         )
#         run_cmd = (
#             f"cd /home/Model_Jarvis/Codes && "
#             f"python init.py run sf={sf} channel_name={quoted_channel} testing_subjects={quoted_subject}"
#         )

#         remote_cmd = f"{install_cmd} && {cwt_cmd} && {run_cmd}"
#         ssh_full_cmd = f'ssh -o StrictHostKeyChecking=no -p 11014 root@sshc.jarvislabs.ai "{remote_cmd}"'
#         print("STEP 4 ✅ Built SSH command")

#         # ✅ 5. Execute SSH and capture live logs
#         process = subprocess.Popen(
#             ssh_full_cmd,
#             shell=True,
#             stdout=subprocess.PIPE,
#             stderr=subprocess.STDOUT,
#             text=True,
#             encoding="utf-8",
#             errors="ignore"
#         )

#         prediction = None
#         while True:
#             line = process.stdout.readline()
#             if not line:
#                 break
#             print(f"🔍 {line.strip()}")
#             if line.strip().startswith("[") and line.strip().endswith("]"):
#                 try:
#                     prediction = eval(line.strip())
#                 except Exception as e:
#                     print(f"⚠️ Eval failed: {e}")

#         process.wait()

#         # ✅ 6. Clean up local temp file
#         try:
#             os.remove(local_edf_path)
#         except Exception:
#             pass

#         if prediction is None:
#             return JsonResponse({"error": "Prediction not found in output"}, status=500)

#         print("STEP 5 ✅ Prediction complete")
#         return JsonResponse({"prediction": prediction})

#     except Exception as e:
#         traceback.print_exc()
#         return JsonResponse({"error": str(e)}, status=500)



from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import JsonResponse
import json
import os
import shlex
import subprocess
import tempfile
import traceback

@csrf_exempt
@require_POST
def jarvis(request):
    try:
        active_folder = request.session.get('files')
        if not active_folder or 'eeg_edf' not in active_folder:
            return JsonResponse({"error": "No EDF path found in session"}, status=400)

        data = json.loads(request.body)
        ssh_cmd_base = data.get("ssh_cmd")
        sf = int(data.get("sfreq", 100))
        channel_name = data.get("channel_name", "EEG Fpz-Cz")

        if not ssh_cmd_base:
            return JsonResponse({"error": "Missing SSH command"}, status=400)

        ssh_cmd = f"{ssh_cmd_base} -tt -o ConnectTimeout=15"
        print("\n🔵 STEP 1 ✅ Input received")
        print(f"SSH CMD: {ssh_cmd}")
        print(f"SFREQ: {sf}")
        print(f"CHANNEL_NAME: {channel_name}")

        # 📥 Download EDF from Dropbox
        dropbox_path = active_folder['eeg_edf']
        edf_filename = os.path.basename(dropbox_path).replace(" ", "_")
        subject_name = edf_filename.replace(".edf", "")
        remote_edf_path = f"/home/Model_Jarvis/Datasets/EDF Files/{subject_name}.edf"

        print(f"\n🔵 STEP 2 ✅ Downloading EDF from Dropbox: {dropbox_path}")
        dbx = get_dropbox_client()
        try:
            _, res = dbx.files_download(dropbox_path)
        except Exception as e:
            return JsonResponse({"error": f"Failed to download from Dropbox: {e}"}, status=500)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".edf") as tmp_file:
            tmp_file.write(res.content)
            local_edf_path = tmp_file.name
            print(f"Local EDF saved at: {local_edf_path}")

        # 📤 Check & Upload EDF
        print(f"\n🔵 STEP 3 ✅ Checking if file exists on remote: {remote_edf_path}")
        check_file_cmd = (
            f'{ssh_cmd} "bash -c \'if test -f \\"{remote_edf_path}\\"; then echo exists; else echo missing; fi\'"'
        )
        result = subprocess.check_output(check_file_cmd, shell=True, text=True).strip()
        print(f"Remote file check output: '{result}'")

        if "missing" in result:
            print("Remote EDF missing, uploading...")
            mkdir_cmd = f'{ssh_cmd} "mkdir -p \\"/home/Model_Jarvis/Datasets/EDF Files\\""'
            subprocess.run(mkdir_cmd, shell=True, check=True)

            scp_cmd = [
                "scp", "-P", "11014",
                local_edf_path,
                f'root@ssha.jarvislabs.ai:{remote_edf_path}'
            ]
            print(f"Running SCP: {' '.join(scp_cmd)}")
            subprocess.run(scp_cmd, check=True)
            print("✅ SCP upload complete.")
        else:
            print("✅ Remote EDF already exists, skipping upload.")

        # 📝 Check if CWT is already extracted
        remote_cwt_images = f"/home/Model_Jarvis/Datasets/CWT Plots/{subject_name}/cwt_images"
        print(f"\n🔵 STEP 4 ✅ Checking CWT images dir: {remote_cwt_images}")
        check_cwt_cmd = (
            f'{ssh_cmd} "bash -c \'if test -d \\"{remote_cwt_images}\\"; then echo exists; else echo missing; fi\'"'
        )
        cwt_result = subprocess.check_output(check_cwt_cmd, shell=True, text=True).strip()
        print(f"CWT check output: '{cwt_result}'")

        if "missing" in cwt_result:
            print("CWT images missing, running extraction...")
            install_cmd = (
                "cd /home/Model_Jarvis/Codes && "
                "pip install mne timm pywavelets torchsummary"
            )
            cwt_cmd = (
                f"cd /home/Model_Jarvis/Codes && "
                f"python init.py cwt sf={sf} channel_name={shlex.quote(channel_name)} selected_subjects={shlex.quote(subject_name)}"
            )
            remote_cmd = f"{install_cmd} && {cwt_cmd}"
            print(f"Run: {remote_cmd}")
            subprocess.run(f'{ssh_cmd} "{remote_cmd}"', shell=True, check=True)
            print("✅ CWT extraction done.")
        else:
            print("✅ CWT already exists, skipping extraction.")

        # 🔮 Run prediction (testing_subjects is just subject_name)
        print(f"\n🔵 STEP 5 ✅ Running prediction for: {subject_name}")
        run_cmd = (
            f"cd /home/Model_Jarvis/Codes && "
            f"python init.py run sf={sf} channel_name={shlex.quote(channel_name)} testing_subjects={shlex.quote(subject_name)}"
        )
        ssh_full_cmd = f'{ssh_cmd} "{run_cmd}"'
        print(f"Run: {ssh_full_cmd}")

        process = subprocess.Popen(
            ssh_full_cmd,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )

        prediction = None
        while True:
            line = process.stdout.readline()
            if not line:
                break
            print(f"🔍 {line.strip()}")
            if line.strip().startswith("[") and line.strip().endswith("]"):
                try:
                    prediction = eval(line.strip())
                    print(f"🎯 Prediction found: {prediction}")
                except Exception as e:
                    print(f"⚠️ Eval failed: {e}")

        process.wait()

        # 🧹 Cleanup
        os.remove(local_edf_path)
        print("✅ Local EDF cleaned up.")

        if prediction is None:
            return JsonResponse({"error": "Prediction not found in output"}, status=500)

        return JsonResponse({"prediction": prediction})

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)
