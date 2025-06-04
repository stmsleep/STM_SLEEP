import pandas as pd
import numpy as np
import dropbox
import io
from django.conf import settings

def get_heart_data_with_time(dropbox_path):
    dbx = dropbox.Dropbox(settings.DROPBOX_ACCESS_TOKEN)

    metadata, response = dbx.files_download(dropbox_path)

    file_text = response.content.decode("utf-8")
    data = pd.read_csv(io.StringIO(file_text))

    data.dropna(subset=["SpO2(%)", "PR(bpm)"], inplace=True)

    spo2_data = data["SpO2(%)"].to_numpy(dtype=np.float32)
    pr_data = data["PR(bpm)"].to_numpy(dtype=np.float32)

    sampling_frequency = 1  # Hz
    num_samples = min(len(spo2_data), len(pr_data))
    times = np.arange(num_samples) / sampling_frequency

    spo2_data = spo2_data[:num_samples]
    pr_data = pr_data[:num_samples]

    return {
        "time": times.tolist(),
        "spo2": spo2_data.tolist(),
        "pr_bpm": pr_data.tolist()
    }
