import pandas as pd
from django.http import JsonResponse
from io import StringIO
from scipy.signal import butter,filtfilt
import numpy as np
from .refresh_token import get_dropbox_client

def process_ecg_file(dropbox_path):

    dbx= get_dropbox_client()

    metadata,response = dbx.files_download(dropbox_path)

    file_text = response.content.decode("utf-8")

    df = pd.read_csv(StringIO(file_text), sep='\t')

    # Check if the required column exists
    channel_name = 'QVAR [LSB]'
    timestamp_col = 'Timestamp [us]'
    if channel_name not in df.columns or timestamp_col not in df.columns:
        return JsonResponse({
            "Error": f"Required columns not found. Available columns: {df.columns.tolist()}"
        }, status=400)

    # Extract data and timestamps
    data = df[channel_name].values.astype(float)
    times = df[timestamp_col].values.astype(float) / 1_000_000  # convert us to seconds

    # Parameters
    sample_rate = 240  # Hz, adjust if your data sample rate is different
    window_size_factor = 0.006

    # Baseline correction (detrending)
    baseline_polyfit = np.polyfit(times, data, 10)
    baseline = np.polyval(baseline_polyfit, times)
    data_corrected = data - baseline

    # Low-pass filter helper
    def lowpass_filter(signal, cutoff, fs, order=4):
        nyquist = 0.5 * fs
        normal_cutoff = cutoff / nyquist
        b, a = butter(order, normal_cutoff, btype='low')
        return filtfilt(b, a, signal)

    data_corrected = lowpass_filter(data_corrected, cutoff=18.5, fs=sample_rate)

    # Moving average smoothing
    def moving_average(signal, window_size):
        return np.convolve(signal, np.ones(window_size) / window_size, mode='same')

    window_size = int(sample_rate * window_size_factor)
    data_corrected = moving_average(data_corrected, window_size)

    # Return processed data
    return JsonResponse({
        "times": times.tolist(),
        "data_corrected": data_corrected.tolist()
    })