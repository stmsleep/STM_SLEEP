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
                    if (entry.name.endswith("eeg_000.npz")):
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
    npz_bytes = io.BytesIO()
    np.savez_compressed(npz_bytes, **np_data_dict)
    npz_bytes.seek(0)

    if len(npz_bytes.getvalue()) > threshold:
        print("Using chunked upload for large .npz")
        upload_large_file(dbx, dropbox_path, npz_bytes)
    else:
        dbx.files_upload(npz_bytes.getvalue(), dropbox_path,
                         mode=dropbox.files.WriteMode.overwrite)


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
            elif filename.startswith('STME') and filename.endswith(".edf"):
                print(f"UPLOADING SLEEP EDF :{full_dropbox_path}")
                if len(file_bytes) > 150 * 1024 * 1024:
                    upload_large_file(dbx, full_dropbox_path,
                                      io.BytesIO(file_bytes))
                else:
                    print(f"Preprocessing {filename} to NPZ")
                    # file_stream = io.BytesIO(file_obj.read())
                    # raw = mne.io.read_raw_edf(file_stream, preload=True)
                    # data, times = raw.get_data(return_times=True)
                    with open("temp_upload.edf", "wb") as f:
                        f.write(file_bytes)

                    raw = mne.io.read_raw_edf("temp_upload.edf", preload=True)
                    data, times = raw.get_data(return_times=True)
                    npz_data = {"data": data, "times": times}
                    os.remove("temp_upload.edf")
                npz_path = full_dropbox_path.rsplit(".", 1)[0] + ".npz"
                save_npz_to_dropbox(dbx, npz_data, npz_path)
            else:
                print(f"Skipping unsupported file: {filename}")

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

        return response

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


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

# @csrf_excempt
# def process_eeg(request):
#     try:
#         active_folder=request.session.get('files')


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
