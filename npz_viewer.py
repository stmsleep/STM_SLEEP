import numpy as np
import os

def read_npz_file(npz_path):
    if not os.path.exists(npz_path):
        print(f"❌ File not found: {npz_path}")
        return

    try:
        data = np.load(npz_path, allow_pickle=True)
        print(f"\n✅ Loaded file: {npz_path}")
        print(f"📂 Keys: {list(data.keys())}\n")

        # Read channel metadata if present
        if 'channel_names' in data:
            print("🎧 Channel Names:")
            for idx, name in enumerate(data['channel_names']):
                print(f"  {idx}: {name}")
            print()

        if 'channel_types' in data:
            print("🧠 Channel Types:")
            print(data['channel_types'])
            print()

        if 'channel_units' in data:
            print("📏 Channel Units:")
            print(data['channel_units'])
            print()

        if 'data' in data and 'times' in data:
            print("📊 Data & Times:")
            print(f"  Data shape   : {data['data'].shape}")
            print(f"  Times shape  : {data['times'].shape}")
            print(f"  First 5 time values: {data['times'][:5]}")
            print(f"  First 5 data points of channel 0: {data['data'][0][:5]}")
            print()

        # Print any other keys
        other_keys = set(data.files) - {'data', 'times', 'channel_names', 'channel_types', 'channel_units'}
        if other_keys:
            print("📦 Other keys in file:")
            for key in other_keys:
                print(f"  - {key}")
        print()

    except Exception as e:
        print(f"❌ Failed to read .npz file: {e}")

if __name__ == "__main__":
    # 👇 Replace this with your actual path
    npz_path = r"C:\Users\Admin\Downloads\STME Sleep Recording_INSIGHT2_315837_2025.05.19T22.45.42+05.30.npz"
    read_npz_file(npz_path)
