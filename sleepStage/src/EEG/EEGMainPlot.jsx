import React from "react";
import ReactECharts from "echarts-for-react";

export default function EEGChannelPlot({ channelName, channelIndex, data, times }) {
  if (!data || !times || !data[channelIndex]) {
    return <div>Loading or invalid data</div>;
  }

  const signal = data[channelIndex];
  const windowSize = 1000;

  const chartData = times.slice(0, windowSize).map((t, i) => [t, signal[i]]);

  const option = {
    title: {
      text: `EEG Signal: ${channelName}`,
    },
    tooltip: {
      trigger: "axis",
    },
    xAxis: {
      type: "value",
      name: "Time (s)",
    },
    yAxis: {
      type: "value",
      name: "Amplitude (μV)",
    },
    series: [
      {
        name: channelName,
        type: "line",
        showSymbol: false,
        data: chartData,
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 300 }} />;
}
