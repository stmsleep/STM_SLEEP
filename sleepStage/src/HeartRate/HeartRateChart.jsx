import React from "react";
import Plot from "react-plotly.js";


export default function HeartRateChart({ prBpm, times }) {
  return (
    <div className="chart-container">
      <Plot
        data={[
          {
            x: times,
            y: prBpm,
            type: "scatter",
            mode: "lines+markers",
            name: "Pulse Rate (bpm)",
            line: { color: "rgba(75,192,192,1)", width: 2 },
            marker: { color: "rgba(75,192,192,0.7)", size: 4 },
            fill: "tozeroy",
            fillcolor: "rgba(75,192,192,0.15)",
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
          displaylogo:false,
        }}
        style={{ width: "100%", height: "500px" }}
      />
    </div>
  );
}
