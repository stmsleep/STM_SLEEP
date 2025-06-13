import React, { useState, useMemo } from "react";
import ReactECharts from "echarts-for-react";

export default function HeartRateChart({ prBpm, times, avg_sleep = null }) {
  const [rangeStart, setRangeStart] = useState(0);
  const windowSize = 600; // 5 minutes assuming 2Hz sampling rate
  const rangeEnd = Math.min(rangeStart + windowSize, times.length);

  // Precompute classified full data only once using useMemo
  const { awakeDataFull, sleepDataFull } = useMemo(() => {
    const awakeData = [];
    const sleepData = [];

    if (avg_sleep != null) {
      prBpm.forEach((val, i) => {
        if (val >= avg_sleep) {
          awakeData.push({ value: [times[i], val] });
          sleepData.push({ value: [times[i], null] });
        } else {
          sleepData.push({ value: [times[i], val] });
          awakeData.push({ value: [times[i], null] });
        }
      });
    }

    return { awakeDataFull: awakeData, sleepDataFull: sleepData };
  }, [avg_sleep, prBpm, times]);

  // Slice visible data
  const visibleTimes = times.slice(rangeStart, rangeEnd);
  const visibleValues = prBpm.slice(rangeStart, rangeEnd);
  const visibleAwakeData = avg_sleep != null ? awakeDataFull.slice(rangeStart, rangeEnd) : [];
  const visibleSleepData = avg_sleep != null ? sleepDataFull.slice(rangeStart, rangeEnd) : [];

  const handleSliderChange = (e) => {
    setRangeStart(Number(e.target.value));
  };

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
        symbolSize: 4,
        lineStyle: { color: "rgba(75,192,192,1)", width: 2 },
        areaStyle: { color: "rgba(75,192,192,0.15)" },
        emphasis: { focus: "series" },
      },
      avg_sleep != null && {
        name: `Avg Heart Rate: ${avg_sleep.toFixed(1)} BPM`,
        type: "line",
        data: new Array(visibleTimes.length).fill(avg_sleep),
        lineStyle: { type: "dashed", color: "black", width: 1 },
        showSymbol: false,
        emphasis: { focus: "series" },
      },
      avg_sleep != null && {
        name: "Awake",
        type: "scatter",
        data: visibleAwakeData,
        symbolSize: 6,
        itemStyle: { color: "#ff4d4f" },
      },
      avg_sleep != null && {
        name: "Sleep",
        type: "scatter",
        data: visibleSleepData,
        symbolSize: 6,
        itemStyle: { color: "#00b894" },
      },
    ].filter(Boolean),
    grid: {
      left: "10%",
      right: "10%",
      bottom: "15%",
    },
    toolbox: {
      feature: {
        dataZoom: { yAxisIndex: "none" },
        restore: {},
      },
    },
    legend: {
      bottom: 10,
    },
  });

  return (
    <div className="chart-container">
      <ReactECharts
        option={getOption()}
        style={{ width: "100%", height: "500px" }}
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
          Showing data from <strong>{rangeStart}s</strong> to{" "}
          <strong>{rangeEnd}s</strong>
        </p>
      </div>
    </div>
  );
}
