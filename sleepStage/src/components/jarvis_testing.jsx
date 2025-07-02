import React, { useState } from "react";
import axios from "axios";
import ReactECharts from "echarts-for-react";

export default function JarvisTesting() {
  const [channelName, setChannelName] = useState("EEG Fpz-Cz");
  const [sfreq, setSfreq] = useState(100);
  const [sshCmd, setSshCmd] = useState("ssh -o StrictHostKeyChecking=no -p 11214 root@ssha.jarvislabs.ai");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handlePredict = async () => {
    setLoading(true);
    setPrediction(null);
    setErrorMsg("");

    

    try {
      const response = await axios.post("http://localhost:8000/jarvis/", {
        channel_name: channelName,
        sfreq: sfreq,
        ssh_cmd: sshCmd,
      }, { withCredentials: true });

      console.log("📦 Full Django response:", response.data);
      setPrediction(response.data.prediction);
    } catch (err) {
      console.error("❌ Axios Error:", err);
      if (err.response && err.response.data && err.response.data.error) {
        setErrorMsg(err.response.data.error);
      } else {
        setErrorMsg("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 🎨 ECharts options for step line plot
  const getChartOptions = () => {
    if (!prediction) return {};

    const timePoints = Array.from({ length: prediction.length }, (_, i) => i);

    return {
      title: { text: 'Sleep Stages (Hypnogram)' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: timePoints,
        name: 'Time (Epochs)',
        nameLocation: 'middle',
        nameGap: 30
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 5,
        interval: 1,
        name: 'Stage',
        nameLocation: 'middle',
        nameGap: 40
      },
      series: [{
        data: prediction,
        type: 'line',
        step: 'middle',
        smooth: false,
        lineStyle: { width: 2 },
        symbol: 'circle',
        symbolSize: 4
      }]
    };
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>🧠 EEG Sleep Stage Prediction</h2>

      <label>Channel Name:</label>
      <input
        type="text"
        value={channelName}
        onChange={(e) => setChannelName(e.target.value)}
      />

      <label>Sampling Frequency (Hz):</label>
      <input
        type="number"
        value={sfreq}
        onChange={(e) => setSfreq(parseInt(e.target.value))}
      />

      <button onClick={handlePredict} disabled={loading} style={{ marginTop: "1rem" }}>
        {loading ? "Predicting..." : "▶️ Run Prediction"}
      </button>

      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

      {prediction && (
        <div style={{ marginTop: "2rem" }}>
          <h3>🧾 Predicted Sleep Stages:</h3>
          <ReactECharts option={getChartOptions()} style={{ height: "400px" }} />

        </div>
      )}
    </div>
  );
}
