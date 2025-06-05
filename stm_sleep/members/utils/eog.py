import dropbox # type: ignore
import io
from django.conf import settings
import pandas as pd
from .refresh_token import get_dropbox_client

def process_sensor_file(dropbox_path):
    
    dbx = get_dropbox_client()

    metadata,response = dbx.files_download(dropbox_path)

    file_text = response.content.decode("utf-8")
    df = pd.read_csv(io.StringIO(file_text),delimiter='\t')

    df = df.dropna(subset=["Timestamp [us]", "QVAR [LSB]"])

    df['Time_s'] = df['Timestamp [us]'] / 1e6

    data = {
        "time": df['Time_s'].tolist(),
        "qvar": df['QVAR [LSB]'].tolist(),
        "a_x": df['A_X [mg]'].tolist(),
        "a_y": df['A_Y [mg]'].tolist(),
        "a_z": df['A_Z [mg]'].tolist(),
        "g_x": df['G_X [dps]'].tolist(),
        "g_y": df['G_Y [dps]'].tolist(),
        "g_z": df['G_Z [dps]'].tolist(),
    }

    return data