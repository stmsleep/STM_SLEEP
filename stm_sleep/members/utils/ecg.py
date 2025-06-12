import json
from .refresh_token import get_dropbox_client

def get_ecg_json(dropbox_path):
    # Step 1: Connect to Dropbox and download the JSON file
    dbx = get_dropbox_client()
    metadata, response = dbx.files_download(dropbox_path)
    print("Downloaded ECG JSON:", dropbox_path)

    # Step 2: Decode the content and parse as JSON
    file_text = response.content.decode("utf-8")
    data = json.loads(file_text)

    # Step 3: Return the parsed ECG dictionary
    return data
