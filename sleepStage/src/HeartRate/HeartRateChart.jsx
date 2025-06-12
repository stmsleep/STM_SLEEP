import React, { useState } from "react";
import ReactECharts from "echarts-for-react";

export default function HeartRateChart({ prBpm, times }) {
  const [rangeStart, setRangeStart] = useState(0);
  const [windowSize, setWindowSize] = useState(600); 
  const handleSliderChange = (e) => {
    setRangeStart(Number(e.target.value));
  };

  const rangeEnd = Math.min(rangeStart + windowSize, times.length);
  const visibleTimes = times.slice(rangeStart, rangeEnd);
  const visibleValues = prBpm.slice(rangeStart, rangeEnd);

  const getOption = () => ({
    title: {
      text: "Pulse Rate Over Time",
      left: "center",
    },
    tooltip: {
      trigger: "axis",
    },
    xAxis: {
      type: "category",
      data: visibleTimes,
      name: "Time (s)",
      boundaryGap: false,
      axisLine: { lineStyle: { color: "#999" } },
      axisLabel: { color: "#444" },
    },
    yAxis: {
      type: "value",
      name: "Pulse Rate (bpm)",
      min: 40,
      max: 140,
      axisLine: { lineStyle: { color: "#999" } },
      axisLabel: { color: "#444" },
      splitLine: { lineStyle: { color: "#e5e7eb" } },
    },
    series: [
      {
        name: "Pulse Rate (bpm)",
        type: "line",
        data: visibleValues,
        showSymbol: true,
        symbolSize: 5,
        lineStyle: {
          color: "#2c3e50",
          width: 2,
        },
        itemStyle: {
          color: "#2c3e50",
        },
        areaStyle: {
          color: "rgba(44, 62, 80, 0.15)",
        },
      },
    ],
    grid: {
      left: "10%",
      right: "10%",
      bottom: "15%",
    },
    dataZoom: [
      {
        type: 'inside',      // Enables zoom via scroll & drag on chart area
        zoomOnMouseWheel: true,
        moveOnMouseWheel: true,
        moveOnMouseMove: true,
        throttle: 50,
      }
    ],
    toolbox: {
      feature: {
        dataZoom: {
          yAxisIndex: 'none',
        },
        restore: {},   // Adds a reset button
      },
    },
  });

  return (
    <div className="chart-container">
      <ReactECharts
        option={getOption()}
        style={{ width: "50%", height: "500px" }}
        notMerge={true}
        lazyUpdate={true}
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
