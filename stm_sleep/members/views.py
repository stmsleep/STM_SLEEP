from django.http import JsonResponse,FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.uploadedfile import UploadedFile
import os,re
from tempfile import NamedTemporaryFile
from .utils.heart_rate import convert_csv_to_edf,get_heart_data_with_time
from .utils.eog import process_sensor_file
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
    
# @csrf_exempt
# def load_summary_pdf(request):

#     file_path = r"C:\Users\Admin\Documents\STM sleep\1905Hari\EMAY SpO2-20250515-065705.pdf"

#     if os.path.exists(file_path):
#         return FileResponse(open(file_path,'rb'),content_type='application/pdf')
#     else:
#         return JsonResponse({'error'},status=500)



import os
import re
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from pdfminer.high_level import extract_text

@csrf_exempt
def load_summary_pdf(request):
    file_path = r"C:\Users\Admin\Documents\STM sleep\1905Hari\EMAY SpO2-20250515-065705.pdf"

    if not os.path.exists(file_path):
        return JsonResponse({'error': 'PDF file not found on server.'}, status=404)

    try:
        text = extract_text(file_path)
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        full_text = "\n".join(lines)

        def extract_after(label):
            for i, line in enumerate(lines):
                if label.lower() in line.lower() and i + 1 < len(lines):
                    return lines[i + 1]
            return "N/A"

        def extract_metrics(metric):
            pattern = rf"{metric}\n(\d+)\n(\d+)\n(\d+)"
            match = re.search(pattern, full_text, re.MULTILINE)
            if match:
                return {
                    "max": match.group(1),
                    "avg": match.group(2),
                    "min": match.group(3),
                }
            return {"max": "N/A", "avg": "N/A", "min": "N/A"}

        def extract_spo2_summary():
            summary = []
            spo2_block = re.findall(r'"(95-100|89-94|80-88|70-79|<70|Total)"\s*,\s*"([\d:]+)"\s*,\s*"(\d+%)"\s*,\s*"(\d+)"', full_text)
            for row in spo2_block:
                summary.append({
                    "range": row[0],
                    "duration": row[1],
                    "total": row[2],
                    "events": row[3]
                })
            return summary

        def extract_thresholds(section_title):
            thresholds = []
            section = re.search(rf"{section_title}[\s\S]*?(?=Definition|Note:)", full_text)
            if section:
                lines = section.group(0).splitlines()
                for i in range(len(lines)):
                    if lines[i] in (">94", "<=94", ">100", "<60"):
                        if i + 2 < len(lines):
                            thresholds.append({
                                "threshold": lines[i],
                                "duration": lines[i+1],
                                "total": lines[i+2]
                            })
            return thresholds

        def extract_odi_block(label):
            block = re.search(rf"{label}[\s\S]*?(?=ODI|SpO2 Threshold|Definition)", full_text)
            data = {"odiPerHour": "N/A", "totalEvents": 0, "timeInEvents": "N/A", "percentageTimeInEvents": "N/A", "avgEventDuration": "N/A"}
            if block:
                block_text = block.group(0)
                data["odiPerHour"] = extract_after_text(block_text, label)
                data["totalEvents"] = int(extract_after_text(block_text, "Total") or "0")
                data["timeInEvents"] = extract_after_text(block_text, "Time in")
                data["percentageTimeInEvents"] = extract_after_text(block_text, "% of Time")
                data["avgEventDuration"] = extract_after_text(block_text, "Avg")
            return data

        def extract_after_text(text, keyword):
            lines = text.splitlines()
            for i, line in enumerate(lines):
                if keyword.lower() in line.lower() and i + 1 < len(lines):
                    return lines[i + 1].strip()
            return "N/A"

        def extract_definition(label):
            match = re.search(rf"{label}:\s*(.*?)\.", full_text)
            if match:
                return match.group(1).strip() + "."
            return "N/A"

        # ---- Patient Info ----
        name = extract_after("Name:")
        age_sex_line = extract_after("Sex:")
        age_match = re.match(r"(\d+)\s*\((.*?)\)", age_sex_line)
        age = age_match.group(1) if age_match else "N/A"
        sex_line = extract_after(age_sex_line)
        sex = sex_line if sex_line.lower() in ["male", "female"] else "N/A"

        # ---- Compose Final JSON ----
        result = {
            "patientInfo": {
                "name": name,
                "age": age,
                "sex": sex,
                "startTime": extract_after("Start time:"),
                "endTime": extract_after("End time:"),
                "duration": extract_after("Duration:"),
                "validTime": extract_after("Valid Time:"),
            },
            "metrics": {
                "spo2": extract_metrics("SpO2"),
                "pr": extract_metrics("PR")
            },
            "spo2Summary": extract_spo2_summary(),
            "odi4": extract_odi_block("ODI 4%"),
            "odi3": extract_odi_block("ODI 3%"),
            "thresholdData": {
                "spo2": extract_thresholds("SpO2 Threshold"),
                "pulseRate": extract_thresholds("Pulse Rate Threshold")
            },
            "definitions": {
                "odi4": extract_definition("Definition: ODI 4%"),
                "odi4Event": extract_definition("ODI 4% Event"),
                "odi3": extract_definition("Definition: ODI 3%"),
                "odi3Event": extract_definition("ODI 3% Event"),
                "threshold": extract_definition("Definition: Threshold"),
            },
        }

        return JsonResponse(result)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
