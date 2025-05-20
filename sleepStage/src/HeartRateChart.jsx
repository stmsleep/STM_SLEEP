import React, { useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJs,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  Title,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";

import "./HeartRateChart.css";

ChartJs.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  Title,
  TimeScale,
  zoomPlugin
);

export default function HeartRateChart({ prBpm, times }) {
  const chartRef = useRef(null);

  const data = {
    labels: times,
    datasets: [
      {
        label: "Pulse Rate (bpm)",
        data: prBpm,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.15)",
        pointRadius: 3,
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          font: { size: 14, weight: "600" },
          color: "#374151",
          // We can't add CSS classes here, so use color/font settings.
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "#1f2937",
        titleFont: { weight: "700" },
        bodyFont: { size: 14 },
        cornerRadius: 6,
        padding: 8,
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "x",
        },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: "x",
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Time (s)",
          font: { size: 16, weight: "600" },
          color: "#374151",
        },
        grid: {
          color: "#e5e7eb",
        },
      },
      y: {
        title: {
          display: true,
          text: "Pulse Rate (bpm)",
          font: { size: 16, weight: "600" },
          color: "#374151",
        },
        suggestedMin: 40,
        suggestedMax: 140,
        grid: {
          color: "#e5e7eb",
        },
      },
    },
  };

  const panLeft = () => {
    const chart = chartRef.current;
    if (chart) {
      chart.pan({ x: 100 });
    }
  };

  const panRight = () => {
    const chart = chartRef.current;
    if (chart) {
      chart.pan({ x: -100 });
    }
  };

  const resetZoom = () => {
    const chart = chartRef.current;
    if (chart) {
      chart.resetZoom();
    }
  };

  return (
    <div className="chart-container">
      <div className="buttons-wrapper">
        <button
          className="chart-button pan-button"
          onClick={panLeft}
          aria-label="Pan chart left"
        >
          ◀️ Pan Left
        </button>
        <button
          className="chart-button reset-button"
          onClick={resetZoom}
          aria-label="Reset zoom"
        >
          🔄 Reset
        </button>
        <button
          className="chart-button pan-button"
          onClick={panRight}
          aria-label="Pan chart right"
        >
          ▶️ Pan Right
        </button>
      </div>
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
}
