from django.http import JsonResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.uploadedfile import UploadedFile
import os
import re

from tempfile import NamedTemporaryFile
from .utils.heart_rate import convert_csv_to_edf, get_heart_data_with_time
from .utils.eog import process_sensor_file
from .utils.summary import extract_summary_pdf
import traceback
import json
path = r"C:\Users\Srinivas\Documents\sleep_data"


@csrf_exempt
def display_users(request):
    users_list = []

    if request.method == 'GET':
        '''for filenames in os.listdir(path):
            if filenames:
                print(filenames)
                users_list.append(filenames)
        print(users_list)'''
        for f, d, ff in os.walk(path):
            if d:
                users_list.extend(d)
                break
    return JsonResponse({
        'users': users_list}
    )


@csrf_exempt
def set_active_user(request):
    if request.method == 'POST':

        try:
            data = json.loads(request.body)
            username = data.get('username')
            print(username)
            if not username:
                return JsonResponse({'error': 'Username is required'}, status=400)

            base_dir = r"C:\Users\Srinivas\Documents\sleep_data"
            user_dir = os.path.join(base_dir, username)

            if not os.path.exists(user_dir):
                return JsonResponse({'error': 'User directory not found'}, status=404)
            # Get list of files in user's directory
            files = os.listdir(user_dir)
            # Store in session
            request.session['username'] = user_dir
            request.session['files'] = files
            # request.session.modified = True
            return JsonResponse({
                'message': 'Session updated',
            })

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

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
        # Optionally copy to a temp file to keep logic similar
        with open(file_path, 'rb') as original_csv, NamedTemporaryFile(suffix='.csv', delete=False) as temp_csv:
            temp_csv.write(original_csv.read())
            temp_csv_path = temp_csv.name

        # Your original logic
        edf_path = convert_csv_to_edf(temp_csv_path)
        pr_data, times = get_heart_data_with_time(edf_path)

        os.remove(temp_csv_path)
        os.remove(edf_path)

        return JsonResponse({
            'message': 'CSV processed successfully.',
            'pr_bpm': pr_data.tolist()[0],
            'times': times.tolist()
        })

    except Exception as e:
        print("Error in upload_csv view:", e)
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def process_eog(request):

    # file_path = r"C:\Users\Srinivas\Documents\Sleep_Stage_Detection\1905Hari\user_1905Hari_eog_000.txt"
    active_user = request.session.get('username')
    print("Session keys:", request.session.keys())
    print("Username in session:", request.session.get('username'))
    print("Files in session:", request.session.get('files'))
    file_path = None
    if active_user:
        print(request.session['files'])
        for files in request.session['files']:
            if (files.endswith('_eog_000.txt')):

                file_path = os.path.join(active_user, files)
                break

    try:
        with open(file_path, 'rb') as original_txt, NamedTemporaryFile(delete=False, suffix=".txt") as temp_txt:

            temp_txt.write(original_txt.read())
            temp_txt_path = temp_txt.name

            processed_data = process_sensor_file(temp_txt_path)
            return JsonResponse(processed_data, safe=False)

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def load_summary_pdf(request):
    active_user = request.session.get('username')
    if active_user:
        print(1)
        pdf_path = [file for file in request.session['files']
                    if file.startswith('EMAY SpO2') and file.endswith('.pdf')]
        pdf_path = os.path.join(active_user, pdf_path[0])
        print(pdf_path)
        print(2)
        try:
            result = extract_summary_pdf(pdf_path)
            return JsonResponse(result)
        except Exception as e:
            return JsonResponse({"Error": str(e)}, status=500)
