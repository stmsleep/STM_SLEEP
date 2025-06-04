import dropbox
import fitz  # PyMuPDF
from django.conf import settings


def give_personal_information(lines):
    try:
        personal = {
            "Name": lines[8],         # Based on the printed output
            "Age": lines[9],
            "Sex": lines[10],
            "Start time": lines[11],
            "End time": lines[12],
            "Duration": lines[13],
            "Valid Time": lines[14],
        }
        return personal
    except IndexError:
        return {"error": "Line indexes out of range. Check PDF formatting."}


def extract_spo2_pr_metrics(lines):
    try:
        start = lines.index("SpO2")
        if lines[start + 1] != "PR":
            return {"error": "Expected 'PR' after 'SpO2'"}

        return {
            "SpO2": {
                "max": lines[start + 3],
                "avg": lines[start + 6],
                "min": lines[start + 9],
            },
            "PR": {
                "max": lines[start + 4],
                "avg": lines[start + 7],
                "min": lines[start + 10],
            },
        }
    except (ValueError, IndexError):
        return {"error": "Unable to locate SpO2/PR metrics block."}


def extract_spo2_summary(lines):
    try:
        # Find all indices where "SpO2" appears
        spo2_indices = [i for i, line in enumerate(
            lines) if line.strip() == "SpO2"]

        if len(spo2_indices) < 2:
            return {"error": "Could not find SpO2 summary block."}

        # Use the SECOND "SpO2" as the starting point for the summary block
        start_index = spo2_indices[1]

        labels = ["95-100", "89-94", "80-88", "70-79", "<70", "Total"]
        durations = lines[start_index + 8:start_index + 14]
        percentages = lines[start_index + 15:start_index + 21]
        events = lines[start_index+23:start_index+29]
        summary = {
            label: {
                "Duration": durations[i],
                "%Total": percentages[i],
                "Events (ODI4%)": events[i]
            } for i, label in enumerate(labels)
        }

        return summary

    except (ValueError, IndexError):
        return {"error": "SpO2 summary format not found or corrupted."}


def extract_odi_info(lines):
    odi_data = {}

    # Helper to extract ODI block by keyword
    def find_odi_block(keyword):
        try:
            idx = [i for i, line in enumerate(
                lines) if line.strip() == keyword][0]
            return {
                f"{keyword}": lines[idx + 1].strip(),  # e.g., '0.0 / hr'
                # last token
                f"Total {keyword} Events": lines[idx + 3].split()[-1],
                f"Time in {keyword} Events": lines[idx + 5].split()[-1],
                f"% of Time in {keyword} Events": lines[idx + 7].split()[-1],
                f"Avg {keyword} Event Duration": lines[idx + 9].split()[-1]
            }
        except IndexError:
            return None
        except ValueError:
            return None

    odi_data["ODI4%"] = find_odi_block("ODI 4%")
    odi_data["ODI3%"] = find_odi_block("ODI 3%")

    return odi_data


def extract_thresholds(lines):
    threshold_data = {}

    for i, line in enumerate(lines):
        if "SpO2 Threshold" in line:
            threshold_data["SpO2 Threshold"] = lines[i].split(":")[-1].strip()
            threshold_data["SpO2 >"] = [
                lines[i+1].strip(), lines[i+11].strip(), lines[i+17].strip()]
            threshold_data["SpO2 <="] = [
                lines[i+2].strip(), lines[i+12].strip(), lines[i+18].strip()]

        if "Pulse Rate Threshold" in line:
            threshold_data["PR >"] = [
                lines[i+1].strip(), lines[i+11].strip(), lines[i+17].strip()]
            threshold_data["PR <"] = [
                lines[i+2].strip(), lines[i+12].strip(), lines[i+18].strip()]

    return threshold_data


def extract_summary_pdf(dropbox_path):
    # Connect to Dropbox using access token
    dbx = dropbox.Dropbox(settings.DROPBOX_ACCESS_TOKEN)

    # Download the file from Dropbox
    metadata, response = dbx.files_download(dropbox_path)

    # Read content into memory
    pdf_bytes = response.content

    # Load PDF directly from bytes
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    all_text = []

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text("text")
        all_text.append(text)

    lines = "\n".join(all_text).splitlines()
    lines = [line.strip() for line in lines if line.strip()]

    # Use your existing parsing functions
    personal_info = give_personal_information(lines)
    metrics = extract_spo2_pr_metrics(lines)
    spo2_summary = extract_spo2_summary(lines)
    odi_info = extract_odi_info(lines)
    thresholds = extract_thresholds(lines)

    return {
        "personal_info": personal_info,
        "spo2_pr_metrics": metrics,
        "spo2_summary": spo2_summary,
        "odi_info": odi_info,
        "thresholds": thresholds,
    }



# print(extract_summary_pdf())