import React from "react";
import ReactECharts from "echarts-for-react";

export default function EEGChannelPlot({ channelName, data, times }) {
  const signal = data[channelName];

  if (!signal || !times || signal.length !== times.length) {
    return <div>Loading or invalid data</div>;
  }

  // Format time to 2 decimal places for even x-axis spacing
  const chartData = times.map((t, i) => [t.toFixed(2), signal[i]]);

  const chartOptions = {
    title: {
      text: `EEG Signal: ${channelName}`,
      left: "center",
    },
    tooltip: {
      trigger: "axis",
    },
    xAxis: {
      type: "category", // 🔥 Fixes spacing issue
      name: "Time (s)",
      nameLocation: "middle",
      nameGap: 25,
      axisLabel: {
        interval: "auto",
        formatter: (value) => `${value}s`,
      },
    },
    yAxis: {
      type: "value",
      name: "Amplitude (μV)",
      nameLocation: "middle",
      nameGap: 35,
      scale: true,
    },
    series: [
      {
        name: channelName,
        type: "line",
        showSymbol: false,
        lineStyle: {
          width: 1.5,
        },
        data: chartData,
      },
    ],
    grid: {
      top: 50,
      bottom: 60,
      left: 60,
      right: 30,
    },
  };

  return (
    <ReactECharts
      option={chartOptions}
      style={{ height: "400px", width: "100%" }}
    />
  );
}
