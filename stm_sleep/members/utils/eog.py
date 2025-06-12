import io
import pandas as pd
from .refresh_token import get_dropbox_client

def process_sensor_file(dropbox_path):
    # Step 1: Get file from Dropbox
    dbx = get_dropbox_client()
    metadata, response = dbx.files_download(dropbox_path)
    print("downloaded")
    # Step 2: Read only required columns with optimized settings
    file_text = response.content.decode("utf-8")
    cols = [
        "Timestamp [us]",
        "QVAR [LSB]",
        "A_X [mg]",
        "A_Y [mg]",
        "A_Z [mg]",
        "G_X [dps]",
        "G_Y [dps]",
        "G_Z [dps]"
    ]

    df = pd.read_csv(
        io.StringIO(file_text),
        delimiter="\t",
        usecols=cols,
        low_memory=False
    )

    # Step 3: Clean and transform
    df.dropna(subset=["Timestamp [us]", "QVAR [LSB]"], inplace=True)
    df["Time_s"] = df["Timestamp [us]"].values / 1e6  # Fast vectorized conversion

    # Step 4: Convert to output dict
    data = {
        "time": df["Time_s"].tolist(),
        "qvar": df["QVAR [LSB]"].tolist(),
        "a_x": df["A_X [mg]"].tolist(),
        "a_y": df["A_Y [mg]"].tolist(),
        "a_z": df["A_Z [mg]"].tolist(),
        "g_x": df["G_X [dps]"].tolist(),
        "g_y": df["G_Y [dps]"].tolist(),
        "g_z": df["G_Z [dps]"].tolist(),
    }

    return data
