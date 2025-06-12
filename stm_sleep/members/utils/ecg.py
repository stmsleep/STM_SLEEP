import pandas as pd
import numpy as np
from io import StringIO
from scipy.signal import butter, filtfilt
from .refresh_token import get_dropbox_client

def process_ecg_file(dropbox_path):
    # Step 1: Download from Dropbox
    dbx = get_dropbox_client()
    metadata, response = dbx.files_download(dropbox_path)
    df = pd.read_csv(StringIO(response.content.decode("utf-8")), sep="\t")

    # Step 2: Extract required columns
    if "QVAR [LSB]" not in df.columns or "Timestamp [us]" not in df.columns:
        raise ValueError("Required columns not found in the ECG file.")

    data = df["QVAR [LSB]"].values.astype(float)
    times = df["Timestamp [us]"].values * 1e-6  # Convert µs to s

    # Step 3: Baseline correction using polynomial detrending
    baseline = np.polyval(np.polyfit(times, data, 10), times)
    data_corrected = data - baseline

    # Step 4: Low-pass Butterworth filter
    def lowpass(signal, cutoff, fs, order=4):
        b, a = butter(order, cutoff / (0.5 * fs), btype="low")
        return filtfilt(b, a, signal)

    sample_rate = 240  # Hz
    data_corrected = lowpass(data_corrected, cutoff=18.5, fs=sample_rate)

    # Step 5: Moving average smoothing
    def smooth(signal, window):
        return np.convolve(signal, np.ones(window) / window, mode="same")

    window_size = max(1, int(sample_rate * 0.006))
    data_corrected = smooth(data_corrected, window_size)

    # Step 6: Return processed results
    return {
        "times": times.tolist(),
        "data_corrected": data_corrected.tolist()
    }
