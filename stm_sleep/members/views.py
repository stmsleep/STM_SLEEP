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
from dropbox.files import FolderMetadata,FileMetadata
from rest_framework.decorators import api_view
from django.conf import settings
from rest_framework.response import Response
# path = r"C:\Users\Admin\Documents\STM sleep"
#DROPBOX_ACCES_TOKEN='sl.u.AFwxaaC94kPtIoeEYtYo6rb2LM5VGsoRIhCNpsR1_8JfU7ehP9_3SWGD3JEsSLgJL7k5roUrNzwPiDTtWhB8JDGKHavJphPiujY-T_XmjV5Do9WqQM87riNjEtSaWbmoNCb4_2OwfhVakKs72dqhdQsZPoni-qOS7xgvDM1RxlBmDFtS1SVT3erFCvW8c8Ie_X7FKB3kNBBzFN3tjtSy5LYaTIq-TgTxh2Og7Ilhw1w70Yx8huRkIe4RFMj7klNHtTjIvucpTu8m1t8IPCo1fq-elhZIUSxzrgvprnIa6DVZrZrvGdgzdDPjHkEkAJGbVHEDZKdRU007BBDPD4ULaLN-86z72VjqXlijBWBM1Y3e7E1Xg-4OX9eUheug2fWOYeIqckSgFPkwfhHiTyqESmx3RSzhvFI3OgMSZ6xVJoN3gV9vYjB0mwXuiEB7s3HfDF97Up8wE1pft0UwjUNsscT4zyh5yrAWFnyvgHfznG2760s96Y8ONmrs4EQGFxA0ai3sBO6vIHsNAJdJxnW2AXZ1MWTF3ot66EfduoR6ouOUYkwd1v87ToY6sWaOZTvcsjhZicqM3CzeL80C6JSn_139M0UeXsPp138RCFdm5wuYzvZLcX_hpuGPhnRsWzc7s9tkQLJ8QZHuvpdBwZO6xcQE9sCp-7QsEMJOQAieB2HgtquoemG-VWc9OeB0gncOw_rViApDSPUDuglMFV314KvEvwGM4COixw6yj7eHQDqXQidBFk_76LZdWJ49REfGx5wCrYCbuOS2F_TxcUeRM7r0f2NBdxi86s2TJ2q-DsDejI3Mx0sNLhIO9GmbtaKNqiv9t-o2muqTEfsVM3fnZk3qo5jX7FHm9fxL0JVr-1k-fbSc96-e3G7YvaFZ5lKSAWxKBEhSO9L88gRoDY3rv9-OAEWrm5SUwgtkgld6Whrfvg0_2dCdZzXzSn3iG-PkheE9zCZjCVILaMRWJxYRiACh4ep-t2oirSgVeH-OFo5QzTjG9r8HieYyPjrjV_ZfmoQB7l9b-HN81ulf-PwbmQgO9k07W4V403z-D_zu6v3Iba422mpX2HM5FvE8ObJnDGhIsmKTlzKbUCGfH-Yu_SAdAAn1XkrDD2t7-NXTSjISovUKU_tCvpxy-d00ekouARJvZPBMGgQfrbF7ozTs8D_GSOGbPO0NevljrWn-2XvyrwIIeEbSBSGw_y-Cs-nps5E6-jKF2OD5OzdCUZf3VgAs0eQ8fTlco1TT4K8XPR_8qAKFTuVFgL6YawX1S2Q6UYLC9CrIvJ03Qx1ZwTzv1aki_JroykJd8dt4lQ6yr2DlX2nB2f47iv4_HLwWKrY5rscV3TfS02Bt1a96Cp-GJb1UatCTzVrra25LFh7h5PpQS03kPubofCWnKbTxhg3f0rvI5qOJH3d8cX_cHvNMxBu9'
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from rest_framework import status

class LoginView(APIView):
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        
        try:
            # Try to get user by email
            user = User.objects.get(email=email)
            user = authenticate(request, username=user.username, password=password)
        except User.DoesNotExist:
            # ✅ Auto-register user
            user = User.objects.create_user(username=email, email=email, password=password)
            user.save()
            dbx = dropbox.Dropbox(settings.DROPBOX_ACCESS_TOKEN)
            folder_path = f"/STM-Sleep/{user.username}"
            try:
                dbx.files_create_folder_v2(folder_path)
            except dropbox.exceptions.ApiError as e:
                # Ignore if folder already exists
                if e.error.is_path() and e.error.get_path().reason.is_conflict():
                    pass
                else:
                    return JsonResponse({'error': f'Dropbox error: {e}'}, status=500)
            
        # Now authenticate
        
        if user is not None:
            request.session["user"]=email
            print(user.username)
            print(request.session["user"])
            refresh = RefreshToken.for_user(user)
            return JsonResponse({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
            
        else:
            return JsonResponse({'error': 'Invalid password'}, status=status.HTTP_401_UNAUTHORIZED)

@csrf_exempt
def list_user_folders(request):
    print(1)
    user=request.session.get("user")
    print(user)
    try:
        dbx = dropbox.Dropbox(settings.DROPBOX_ACCESS_TOKEN)

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

            dbx = dropbox.Dropbox(settings.DROPBOX_ACCESS_TOKEN)
            user=request.session["user"]
            base_dir = f"/STM-Sleep/{user}/"
            base_dir+=folder
        
            result = dbx.files_list_folder(base_dir)
           

            folder_files = []
            request.session['files'] = {
                "pdf_summary": "",
                "heart_rate_csv":"",
                "eog_txt":"",
                "ecg_txt":"",
            }

            for entry in result.entries:
                print(entry.name)
                if isinstance(entry, FileMetadata):
                    folder_files.append(entry.name)
                    if(entry.name.startswith('EMAY SpO2') and entry.name.endswith('.pdf')):
                    
                        request.session['files']["pdf_summary"] = base_dir+"/"+entry.name
                    if(entry.name.startswith('EMAY SpO2') and entry.name.endswith('.csv')):
                    
                        request.session['files']["heart_rate_csv"] = base_dir+"/"+entry.name
                    if(entry.name.endswith('_eog_000.txt')):
                        request.session['files']["eog_txt"]=base_dir+"/"+entry.name
                    if(entry.name.endswith("ecg_000.txt")):
                        request.session['files']["ecg_txt"]=base_dir+"/"+entry.name
                        
            print(request.session["files"])
            
            # Store in session
            request.session.modified = True
            
            return JsonResponse({
                'message': 'Session updated',
            },status=200)

        except Exception as e:
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=400)


@csrf_exempt
def upload_folder(request):
    if request.method == 'POST':
        username = request.POST.get("username")
        user_folder = request.FILES.getlist("folder[]")

        if not username:
            return JsonResponse({'error': 'Username is required'}, status=400)

        dbx = dropbox.Dropbox(settings.DROPBOX_ACCESS_TOKEN)

        for file_obj in user_folder:
            # Construct the path on Dropbox
            dropbox_path = f"/STM-sleep/{username}/{file_obj.name}"
            dbx.files_upload(file_obj.read(), dropbox_path, mode=dropbox.files.WriteMode.overwrite)

        return JsonResponse({'message': 'Folder uploaded successfully'})

    return JsonResponse({'error': 'Invalid request method'}, status=400)
@csrf_exempt
def upload_csv(request):
    active_user_dir = request.session.get('username')  # directory path stored
    if not active_user_dir:
        return JsonResponse({'error': 'No active user set in session.'}, status=400)

    file_path = None
    for filename in request.session.get('files', []):
        if filename.startswith("EMAY SpO2") and filename.endswith('.csv'):
            file_path = os.path.join(active_user_dir, filename)
            break

    if not file_path or not os.path.exists(file_path):
        return JsonResponse({'error': 'CSV file not found at path.'}, status=404)
    try:

        result = get_heart_data_with_time(file_path)

        print("Type of Heart Data ", type(result))

        return JsonResponse(result,status=200)

    except Exception as e:
        print("Error in upload_csv view:", e)
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def process_eog(request):

    active_user = request.session.get('username')
    file_path = None
    if active_user:
        print(request.session['files'])
        for files in request.session['files']:
            if (files.endswith('_eog_000.txt')):

                file_path = os.path.join(active_user, files)
                break

    try:

            processed_data = process_sensor_file(file_path)
            print(len(processed_data))
            print("Type of EOG",type(processed_data))
            return JsonResponse(processed_data, safe=False)

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def load_summary_pdf(request):
    active_user = request.session.get('files')
    if active_user:
        print(1)
        
        pdf_path = active_user['pdf_summary']
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
    active_user = request.session.get('username')

    if not active_user:
        traceback.print_exc()
        return JsonResponse({"Error": "No active user found"}, status=400)

    try:
        # Identify ECG TXT file (assuming you saved it in session['files'])
        txt_files = [f for f in request.session.get('files', []) if f.endswith("ecg_000.txt")]
        if not txt_files:
            return JsonResponse({"Error": "ECG TXT file not found"}, status=404)

        file_path = os.path.join(active_user, txt_files[0])
        
        result = process_ecg_file(file_path)
        
        return result

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"Error": str(e)}, status=500)

