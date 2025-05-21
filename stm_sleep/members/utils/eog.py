# utils/signal_processor.py
import pandas as pd
import numpy as np
from scipy.interpolate import interp1d

def process_sensor_file(file_path):
    """Parses and structures sensor data from a .txt file."""
    df = pd.read_csv(file_path,delimiter='\t',engine='python')

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