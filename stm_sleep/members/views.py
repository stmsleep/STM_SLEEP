import pandas as pd
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

import os
from tempfile import NamedTemporaryFile
from .utils.heart_rate import convert_csv_to_edf,get_heart_data_with_time

@csrf_exempt
def upload_csv(request):
    if request.method == 'POST' and request.FILES.get('file'):
        file = request.FILES['file']

        with NamedTemporaryFile(suffix='.csv', delete=False) as temp_csv:
            for chunk in file.chunks():
                temp_csv.write(chunk)
            temp_csv_path = temp_csv.name

        try:
        
            edf_path = convert_csv_to_edf(temp_csv_path)
            pr_data,times = get_heart_data_with_time(edf_path)

            os.remove(temp_csv_path)
            os.remove(edf_path)

            return JsonResponse({
                'message':'CSV processed successfully.',
                'pr_bpm':pr_data.tolist()[0],
                'times':times.tolist()
            })

        except Exception as e:
            print("Error in upload_csv view:", e)
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request. File missing or wrong method.'}, status=400)

