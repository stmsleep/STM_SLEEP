import io
import json
from .refresh_token import get_dropbox_client

def get_eog_json(dropbox_path):
    dbx = get_dropbox_client()
    metadata, response = dbx.files_download(dropbox_path)
    print("Downloaded JSON:", dropbox_path)

    file_text = response.content.decode("utf-8")
    data = json.loads(file_text)
    print(1)
    return data

