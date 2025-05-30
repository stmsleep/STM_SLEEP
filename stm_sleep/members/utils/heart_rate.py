import pandas as pd
import numpy as np

def get_heart_data_with_time(csv_file_path):
    # Read data from CSV
    data = pd.read_csv(csv_file_path)

    data.dropna(subset=["SpO2(%)", "PR(bpm)"], inplace=True)

    # Extract SpO2 and PR(bpm) columns
    spo2_data = data["SpO2(%)"].to_numpy(dtype=np.float32)
    pr_data = data["PR(bpm)"].to_numpy(dtype=np.float32)

    # Compute timestamps (assuming 1 Hz sampling rate if no time column exists)
    sampling_frequency = 1  # Hz
    num_samples = min(len(spo2_data), len(pr_data))
    times = np.arange(num_samples) / sampling_frequency

    # Trim data to equal lengths
    spo2_data = spo2_data[:num_samples]
    pr_data = pr_data[:num_samples]

    data = {
        "time": times.tolist(),
        "spo2": spo2_data.tolist(),
        "pr_bpm": pr_data.tolist()
    }

    return data