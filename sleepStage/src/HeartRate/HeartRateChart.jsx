import React, { useState } from "react";
import Plot from "react-plotly.js";

export default function HeartRateChart({ prBpm, times }) {
  const [rangeStart, setRangeStart] = useState(0);
  const [windowSize, setWindowSize] = useState(600); // default window size in seconds

  const handleSliderChange = (e) => {
    setRangeStart(Number(e.target.value));
  };

  // Calculate the data range
  const rangeEnd = Math.min(rangeStart + windowSize, times.length);
  const visibleTimes = times.slice(rangeStart, rangeEnd);
  const visibleValues = prBpm.slice(rangeStart, rangeEnd);

  return (
    <div className="chart-container">
      <Plot
        data={[
          {
            x: visibleTimes,
            y: visibleValues,
            type: "scatter",
            mode: "lines+markers",
            name: "Pulse Rate (bpm)",
            line: { color: "#2c3e50", width: 2 },
            marker: { color: "#2c3e50", size: 4 },
            fill: "tozeroy",
            fillcolor: "rgba(44, 62, 80, 0.15)",
          },
        ]}
        layout={{
          title: "Pulse Rate Over Time",
          xaxis: {
            title: "Time (s)",
            showgrid: true,
            gridcolor: "#e5e7eb",
          },
          yaxis: {
            title: "Pulse Rate (bpm)",
            range: [40, 140],
            showgrid: true,
            gridcolor: "#e5e7eb",
          },
          margin: { t: 40, l: 50, r: 30, b: 50 },
          legend: {
            font: { size: 14, color: "#374151" },
          },
        }}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
        }}
        style={{ width: "100%", height: "500px" }}
      />

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <label>
          Scroll through time:
          <input
            type="range"
            min={0}
            max={Math.max(times.length - windowSize, 0)}
            value={rangeStart}
            step={10}
            onChange={handleSliderChange}
            style={{ width: "80%", marginLeft: "10px" }}
          />
        </label>
        <p>
          Showing data from {rangeStart}s to {rangeEnd}s
        </p>
      </div>
    </div>
  );
}
