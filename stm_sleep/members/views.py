from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import os
from .utils.heart_rate import get_heart_data_with_time
from .utils.eog import process_sensor_file
from .utils.summary import extract_summary_pdf
from .utils.ecg import process_ecg_file
import traceback
import json

path = r"C:\Users\Admin\Documents\STM sleep"

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

            base_dir = r"C:\Users\Admin\Documents\STM sleep"
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

