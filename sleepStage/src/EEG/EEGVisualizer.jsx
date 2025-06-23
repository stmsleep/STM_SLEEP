import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { parseNPZ } from "../utils/parseNpz"
import EEGChannelPlot from "./EEGMainPlot";
import "../styles/EEG.css";

export default function EEGChart() {
  const [channel, setChannel] = useState("");
  const [channelList, setChannelList] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [eegData, setEegData] = useState(null);
  const [samplingRate, setSamplingRate] = useState(256);
  const windowSize = useMemo(() => samplingRate * 60, [samplingRate]);
  const [rangeStart, setRangeStart] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!selectedChannel) return;

    const fetchEEGData = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/process_eeg/${selectedChannel}/`,
          { withCredentials: true }
        );
        const { npz_link, band_plot_url, sampling_rate, channel } = res.data;

        const npzRes = await fetch(npz_link);
        const npzBuffer = await npzRes.arrayBuffer();
        const parsed = await parseNPZ(npzBuffer);

        setEegData({
          channel,
          band_plot_url,
          signal: parsed.signal,
          times: parsed.times,
          sampling_rate: parsed.sampling_rate,
        });

        console.log(eegData);

        setSamplingRate(parsed.sampling_rate || 256);
        setRangeStart(0);
      } catch (err) {
        console.error("Error fetching EEG data:", err);
      }
    };

    fetchEEGData();
  }, [selectedChannel]);

  const handleSliderChange = (e) => {
    setRangeStart(Number(e.target.value) * windowSize);
  };

  const totalMinutes = eegData?.times?.length
    ? Math.floor(eegData.times.length / windowSize)
    : 0;

  const rangeEnd =
    eegData?.times?.length > 0
      ? Math.min(rangeStart + windowSize, eegData.times.length)
      : 0;

  const visibleTimes =
    eegData?.times?.length > 0 ? eegData.times.slice(rangeStart, rangeEnd) : [];

  const visibleSignal =
    eegData?.signal?.length > 0
      ? eegData.signal.slice(rangeStart, rangeEnd)
      : [];

  return (
    <div className="eeg-container">
      {/* Channel Navbar */}
      <div className="channel-navbar">
        <div className="channel-list">
          {channelList.map((ch, idx) => (
            <div
              key={idx}
              className={`channel-tab ${selectedChannel === ch ? "active" : ""}`}
              onClick={() => setSelectedChannel(ch)}
            >
              {ch}
            </div>
          ))}
        </div>
        <button className="add-channel-btn" onClick={() => setShowModal(true)}>
          + Add Channel
        </button>
      </div>

      {eegData && eegData.times && eegData.signal && (
        <div className="eeg-section">
          <h2 className="eeg-heading">Raw EEG Signal</h2>
          <EEGChannelPlot
            channelName={eegData.channel}
            data={{ [eegData.channel]: visibleSignal }}
            times={visibleTimes}
          />

          <div className="slider-container">
            <input
              type="range"
              min="0"
              max={totalMinutes - 1}
              value={Math.floor(rangeStart / windowSize)}
              onChange={handleSliderChange}
              className="eeg-slider"
            />
            <div className="slider-footer">
              <span>
                Minute: {Math.floor(rangeStart / windowSize) + 1} / {totalMinutes}
              </span>
              <div className="freq-control">
                <label htmlFor="freq">Sampling Rate:</label>
                <input
                  id="freq"
                  type="number"
                  value={samplingRate}
                  onChange={(e) => {
                    let val = Number(e.target.value);
                    if (val > 256) val = 256;
                    if (val < 1) val = 1;
                    setSamplingRate(val);
                  }}
                  min="1"
                  max="256"
                  step="1"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {eegData?.band_plot_url && (
        <div className="band-image-container">
          <h3>Frequency Band Visualization</h3>
          <img src={eegData.band_plot_url} alt="Band" className="band-image" />
        </div>
      )}

      {/* Modal for adding a channel */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Add EEG Channel</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (channel.trim() !== "" && !channelList.includes(channel)) {
                  setChannelList([channel, ...channelList]);
                  setChannel("");
                }
                setShowModal(false);
              }}
              className="modal-form"
            >
              <input
                type="text"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                placeholder="Enter Channel Name"
              />
              <button type="submit">Add</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
