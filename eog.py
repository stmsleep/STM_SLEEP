import pandas as pd
import numpy as np
import scipy.signal as signal
from scipy.ndimage import label


def detect_eye_movements(eog_signal, fs=100):
    """
    Detects eye movements in an EOG signal using slope and amplitude thresholding.

    Parameters:
    - eog_signal: 1D numpy array of EOG signal
    - fs: Sampling frequency in Hz

    Returns:
    - event_times: list of timestamps (in seconds) of detected eye movements
    - summary: dict with count and rate
    """
    t = np.linspace(0, len(eog_signal)/fs, len(eog_signal))

    # 1. Bandpass Filter (0.1 - 10 Hz)
    b, a = signal.butter(2, [0.1, 10], btype='band', fs=fs)
    filtered = signal.filtfilt(b, a, eog_signal)

    # 2. Smoothing
    smoothed = signal.savgol_filter(filtered, 51, 3)

    # 3. Slope
    slope = np.gradient(smoothed)

    # 4. Thresholding
    slope_thresh = 0.5  # 0.1
    amp_thresh = 0.8  # 0.3
    movement_mask = (np.abs(slope) > slope_thresh) & (
        np.abs(smoothed) > amp_thresh)

    # 5. Grouping
    labeled_array, num_features = label(movement_mask)
    event_times = [t[np.where(labeled_array == i)[0][0]]
                   for i in range(1, num_features+1)]

    summary = {
        "total_eye_movements": len(event_times),
        "duration_minutes": t[-1] / 60,
        "events_per_min": len(event_times) / (t[-1] / 60)
    }

    return event_times, summary


# Load file (update column name if needed)
df = pd.read_csv(
    r"C:\Users\Srinivas\Documents\sleep_data\1905Srini\user_1905Hari_eog_000.txt", delimiter='\t')  # or .txt

eog_signal = df['QVAR [LSB]'].values  # 1D numpy array
fs = 100  # or whatever your sampling rate is (must know this!)
data, summary = detect_eye_movements(eog_signal)
print(summary)
