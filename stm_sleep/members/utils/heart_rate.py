import pandas as pd
import numpy as np
import pyedflib
import mne


def convert_csv_to_edf(csv_file_path):
    data = pd.read_csv(csv_file_path)

    spo2_data = data["SpO2(%)"].to_numpy(dtype=np.float32)
    pr_data = data["PR(bpm)"].to_numpy(dtype=np.float32)

    min_len = min(len(spo2_data), len(pr_data))
    spo2_data = spo2_data[:min_len]
    pr_data = pr_data[:min_len]

    sampling_frequency = 1  # Set your actual sampling rate

    output_edf_path = csv_file_path.replace(".csv", ".edf")

    edf_writer = pyedflib.EdfWriter(
        output_edf_path,
        n_channels=2,
        file_type=pyedflib.FILETYPE_EDFPLUS
    )

    signal_headers = []
    for label, signal in zip(['SpO2(%)', 'PR(bpm)'], [spo2_data, pr_data]):
        signal_headers.append({
            'label': label,
            'dimension': 'a.u.',
            'sample_frequency': sampling_frequency,
            'physical_min': float(np.nanmin(signal)),
            'physical_max': float(np.nanmax(signal)),
            'digital_min': -32768,
            'digital_max': 32767,
            'transducer': '',
            'prefilter': '',
        })

    edf_writer.setSignalHeaders(signal_headers)
    edf_writer.writeSamples([spo2_data, pr_data])
    edf_writer.close()

    return output_edf_path


def get_heart_data_with_time(edf_file):
    raw = mne.io.read_raw_edf(edf_file, preload=True)
    raw.pick_channels(['PR(bpm)'])
    data, times = raw[:]
    return data, times
