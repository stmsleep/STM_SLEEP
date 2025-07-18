import React, { useState } from "react";
import axios from "axios";
import "./ChannelInput.css";

const CHANNELS = [
  "Fp1",
  "Fp2",
  "F3",
  "Fz",
  "F4",
  "F8",
  "T3",
  "C3",
  "Cz",
  "C4",
  "T4",
  "T5",
  "P3",
  "Pz",
  "P4",
  "T6",
  "O1",
  "O2",
];

function ChannelInput({ onNext }) {
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [showOthersInput, setShowOthersInput] = useState(false);
  const [otherChannel, setOtherChannel] = useState("");
  const [samplingFrequency, setSamplingFrequency] = useState("");

  const handleSelect = (e) => {
    const value = e.target.value;
    if (value && !selectedChannels.includes(value)) {
      setSelectedChannels([...selectedChannels, value]);
    }
    e.target.selectedIndex = 0;
  };

  const removeChannel = (channel) => {
    setSelectedChannels(selectedChannels.filter((ch) => ch !== channel));
  };

  const handleSubmit = async () => {
    const dataToSend = [...selectedChannels];
    if (showOthersInput && otherChannel.trim()) {
      dataToSend.push(otherChannel.trim());
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/save_channels/",
        {
          channels: dataToSend,
          sampling_frequency: parseInt(samplingFrequency),
        },
        { withCredentials: true }
      );

      if (response.status === 201 && onNext) {
        onNext();
      } else {
        alert("Unexpected server response.");
      }
    } catch (error) {
      console.error("Error submitting channels:", error);
      alert("Error submitting data.");
    }
  };

  return (
    <div className="channel-container">
      <div className="channel-box">
        <h2 className="channel-title">Select EEG Channels</h2>

        <select onChange={handleSelect} className="channel-select">
          <option value="">-- Select a Channel --</option>
          {CHANNELS.map((channel) => (
            <option key={channel} value={channel}>
              {channel}
            </option>
          ))}
        </select>

        <div className="chip-container">
          {selectedChannels.map((channel) => (
            <div className="chip" key={channel}>
              {channel}
              <button
                className="chip-close"
                onClick={() => removeChannel(channel)}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showOthersInput}
            onChange={(e) => setShowOthersInput(e.target.checked)}
          />
          Add Other Channel
        </label>

        {showOthersInput && (
          <input
            type="text"
            placeholder="Enter custom channel"
            value={otherChannel}
            onChange={(e) => setOtherChannel(e.target.value)}
            className="other-input"
          />
        )}

        <input
          type="number"
          placeholder="Enter Sampling Frequency (Hz)"
          value={samplingFrequency}
          onChange={(e) => setSamplingFrequency(e.target.value)}
          className="other-input"
        />

        <button className="submit-btn" onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
}

export default ChannelInput;
