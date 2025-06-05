from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import os
from .utils.heart_rate import get_heart_data_with_time
from .utils.eog import process_sensor_file
from .utils.summary import extract_summary_pdf
from .utils.ecg import process_ecg_file
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
            }

            for entry in result.entries:
                print(entry.name)
                if isinstance(entry, FileMetadata):
                    folder_files.append(entry.name)
                    if (entry.name.startswith('EMAY SpO2') and entry.name.endswith('.pdf')):

                        request.session['files']["pdf_summary"] = base_dir + \
                            "/"+entry.name
                    if (entry.name.startswith('EMAY SpO2') and entry.name.endswith('.csv')):

                        request.session['files']["heart_rate_csv"] = base_dir + \
                            "/"+entry.name
                    if (entry.name.endswith('_eog_000.txt')):
                        request.session['files']["eog_txt"] = base_dir + \
                            "/"+entry.name
                    if (entry.name.endswith("ecg_000.txt")):
                        request.session['files']["ecg_txt"] = base_dir + \
                            "/"+entry.name

            print(request.session["files"])

            # Store in session
            request.session.modified = True

            return JsonResponse({
                'message': 'Session updated',
            }, status=200)

        except Exception as e:
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=400)


@csrf_exempt
def upload_folder(request):
    print("Cookies:", request.COOKIES)
    print("Session:", request.session.items())
    user = request.session.get("user")
    print("User:     ", user)

    if request.method == 'POST':
        username = request.session.get("user")
        print("Session username:", username)

        if not username:
            return JsonResponse({'error': 'User not authenticated'}, status=400)

        try:
            dbx = get_dropbox_client()

            for key, file_obj in request.FILES.items():
                file_path = file_obj.name
                dropbox_path = f"/STM-Sleep/{username}/{file_path}"

                print(f"Uploading to Dropbox: {dropbox_path}")
                dbx.files_upload(file_obj.read(), dropbox_path,
                                 mode=dropbox.files.WriteMode.overwrite)

            return JsonResponse({'message': 'Folder uploaded successfully'})

        except Exception as e:
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=400)



'''@csrf_exempt
def upload_folder(request):
    if request.method == 'POST':
        print("Cookies:", request.COOKIES)
        username = request.session.get("user")
        print(username)
        user_folder = request.FILES.getlist("folder[]")

        if not username:
            return JsonResponse({'error': 'Username is required'}, status=400)

        dbx = dropbox.Dropbox(settings.DROPBOX_ACCESS_TOKEN)

        for file_obj in user_folder:
            # Construct the path on Dropbox
            relative_path = file_obj.name
            dropbox_path = f"/STM-sleep/{username}/{relative_path}"
            dbx.files_upload(file_obj.read(), dropbox_path,
                             mode=dropbox.files.WriteMode.overwrite)

        return JsonResponse({'message': 'Folder uploaded successfully'})

    return JsonResponse({'error': 'Invalid request method'}, status=400)
'''


@csrf_exempt
def upload_folder(request):
    if request.method == 'POST':
        username = request.session.get("user")
        if not username:
            return JsonResponse({'error': 'No active session/user'}, status=400)

        # 'files' is a list of uploaded file objects
        files = request.FILES.getlist('files')
        paths = request.POST.getlist('paths')  # relative paths!

        if not files or not paths or len(files) != len(paths):
            return JsonResponse({'error': 'Invalid file data'}, status=400)

        dbx = get_dropbox_client()

        try:
            for file_obj, relative_path in zip(files, paths):
                # Reconstruct Dropbox path:
                dropbox_path = f"/STM-Sleep/{username}/{relative_path}"
                print(f"Uploading to: {dropbox_path}")

                # Create parent folders if needed (Dropbox auto-creates intermediate folders)
                dbx.files_upload(file_obj.read(), dropbox_path,
                                 mode=dropbox.files.WriteMode.overwrite)

            return JsonResponse({'message': 'Folder uploaded successfully'})

        except Exception as e:
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=400)
        

@csrf_exempt
def heart_rate(request):
    active_folder = request.session.get('files')  # directory path stored
    if not active_folder:
        return JsonResponse({'error': 'No active user set in session.'}, status=400)

    try:

        file_path = active_folder['heart_rate_csv']

        result = get_heart_data_with_time(file_path)

        print("Type of Heart Data ", type(result))

        return JsonResponse(result, status=200)

    except Exception as e:
        print("Error in upload_csv view:", e)
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def process_eog(request):

    active_folder = request.session.get('files')
    if active_folder:
        try:
            file_path = active_folder['eog_txt']
            processed_data = process_sensor_file(file_path)
            print(len(processed_data))
            print("Type of EOG", type(processed_data))
            return JsonResponse(processed_data, safe=False)

        except Exception as e:
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def load_summary_pdf(request):
    active_folder = request.session.get('files')
    
    if active_folder:
        print(1)
        print(active_folder)
        pdf_path = active_folder['pdf_summary']
        print("From load summary pdf :",pdf_path)
        print(pdf_path)
        print(2)
        try:
            result = extract_summary_pdf(pdf_path)
            return JsonResponse(result)
        except Exception as e:
            traceback.print_exc()
            return JsonResponse({"Error": str(e)}, status=500)


@csrf_exempt
def process_ecg(request):
    active_folder = request.session.get('files')

    if not active_folder:
        traceback.print_exc()
        return JsonResponse({"Error": "No active user found"}, status=400)

    try:
        # Identify ECG TXT file (assuming you saved it in session['files'])
        file_path = active_folder['ecg_txt']

        result = process_ecg_file(file_path)

        return result

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"Error": str(e)}, status=500)



# Dropbox token creation

#https://www.dropbox.com/oauth2/authorize?client_id=YOUR_APP_KEY&response_type=code&redirect_uri=YOUR_REDIRECT_URI&token_access_type=offline
#this is url to get refresh token at first

import requests
from django.conf import settings
from django.shortcuts import redirect
from django.http import HttpResponse
from django.utils import timezone
from datetime import timedelta
from .models import DropboxToken

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
