from django.http import JsonResponse,FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.uploadedfile import UploadedFile
import os,re
from tempfile import NamedTemporaryFile
from .utils.heart_rate import convert_csv_to_edf,get_heart_data_with_time
from .utils.eog import process_sensor_file
from .utils.summary import extract_summary_pdf
import traceback


@csrf_exempt
def upload_csv(request):
    if request.method == 'POST':

        file_path = r"C:\Users\Admin\Documents\STM sleep\1905Hari\EMAY SpO2-20250515-065705.csv"

        if not os.path.exists(file_path):
            return JsonResponse({'error': 'CSV file not found at path.'}, status=404)

        try:
            # Optionally copy to a temp file to keep logic similar
            with open(file_path, 'rb') as original_csv,NamedTemporaryFile(suffix='.csv', delete=False) as temp_csv:
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

    return JsonResponse({'error': 'Invalid request method.'}, status=400)

@csrf_exempt
def process_eog(request):
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)


    file_path = r"C:\Users\Admin\Documents\STM sleep\1905Hari\user_1905Hari_eog_000.txt"

    if not os.path.exists(file_path) or not file_path.endswith('.txt'):
        return JsonResponse({'error': 'Text file not found at path.'}, status=404)

    try:
        with open(file_path,'rb') as original_txt ,NamedTemporaryFile(delete=False, suffix=".txt") as temp_txt:
            
            temp_txt.write(original_txt.read())
            temp_txt_path = temp_txt.name

            processed_data = process_sensor_file(temp_txt_path)
            return JsonResponse(processed_data, safe=False)

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)
    
@csrf_exempt
def load_summary_pdf(request):
    try:
        result = extract_summary_pdf()
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({"Error" : str(e)},status=500)
