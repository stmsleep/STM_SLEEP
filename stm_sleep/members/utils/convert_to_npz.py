import pandas as pd
import numpy as np
from scipy.signal import butter, filtfilt

def process_eog_to_npz(file_obj):
    cols = [
        "Timestamp [us]", "QVAR [LSB]", "A_X [mg]", "A_Y [mg]", "A_Z [mg]",
        "G_X [dps]", "G_Y [dps]", "G_Z [dps]"
    ]
    df = pd.read_csv(file_obj, delimiter="\t", usecols=cols, low_memory=False)
    df.dropna(subset=["Timestamp [us]", "QVAR [LSB]"], inplace=True)
    df["Time_s"] = df["Timestamp [us]"].values / 1e6
    return {
        "time": df["Time_s"].values.astype(np.float32),
        "qvar": df["QVAR [LSB]"].values.astype(np.float32),
        "a_x": df["A_X [mg]"].values.astype(np.float32),
        "a_y": df["A_Y [mg]"].values.astype(np.float32),
        "a_z": df["A_Z [mg]"].values.astype(np.float32),
        "g_x": df["G_X [dps]"].values.astype(np.float32),
        "g_y": df["G_Y [dps]"].values.astype(np.float32),
        "g_z": df["G_Z [dps]"].values.astype(np.float32),
    }

# -------------------- ECG Processing --------------------
def process_ecg_to_npz(file_path):
    df = pd.read_csv(file_path, sep="\t")
    data = df["QVAR [LSB]"].values.astype(np.float32)
    times = df["Timestamp [us]"].values * 1e-6
    baseline = np.polyval(np.polyfit(times, data, 10), times)
    data_corrected = data - baseline

    def lowpass(signal, cutoff, fs, order=4):
        b, a = butter(order, cutoff / (0.5 * fs), btype="low")
        return filtfilt(b, a, signal)

    def smooth(signal, window):
        return np.convolve(signal, np.ones(window) / window, mode="same")

    sample_rate = 240
    data_corrected = lowpass(data_corrected, cutoff=18.5, fs=sample_rate)
    data_corrected = smooth(data_corrected, max(1, int(sample_rate * 0.006)))

    return {
        "time": times.astype(np.float32),
        "qvar": data_corrected.astype(np.float32),
    }

# -------------------- SpO2 Processing --------------------
def process_heart_to_npz(file_path):
    df = pd.read_csv(file_path)
    df.dropna(subset=["SpO2(%)", "PR(bpm)"], inplace=True)
    spo2 = df["SpO2(%)"].to_numpy(dtype=np.float32)
    pr = df["PR(bpm)"].to_numpy(dtype=np.float32)
    num_samples = min(len(spo2), len(pr))
    times = np.arange(num_samples, dtype=np.float32)
    return {
        "time": times,
        "spo2": spo2[:num_samples],
        "pr_bpm": pr[:num_samaples]
    }
