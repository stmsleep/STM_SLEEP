import json
from .refresh_token import get_dropbox_client

def get_heartdata_json(dropbox_path):
    # Step 1: Connect to Dropbox and download the JSON file
    dbx = get_dropbox_client()
    metadata, response = dbx.files_download(dropbox_path)
    print("Downloaded Heart JSON:", dropbox_path)

    # Step 2: Decode and parse the JSON content
    file_text = response.content.decode("utf-8")
    data = json.loads(file_text)

    # Step 3: Return the structured heart data
    return data
