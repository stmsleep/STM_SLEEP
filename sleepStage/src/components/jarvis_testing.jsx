import React, { useState } from "react";
import axios from "axios";
import ReactECharts from "echarts-for-react";

export default function SleepDashboard() {
  const [channelName, setChannelName] = useState("T7");
  const [sfreq, setSfreq] = useState(100);
  const [sshCmd, setSshCmd] = useState("ssh -o StrictHostKeyChecking=no -p 11414 root@ssha.jarvislabs.ai");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ---------------------- Helper for stats ----------------------
  const getSleepStats = (data) => {
    if (!data || data.length === 0) return null;

    const totalEpochs = data.length;
    const stageCounts = { 0:0, 1:0, 2:0, 3:0, 4:0 };
    data.forEach(stage => stageCounts[stage]++);

    const percentages = Object.fromEntries(
      Object.entries(stageCounts).map(([k, v]) => [k, ((v/totalEpochs)*100).toFixed(1)])
    );

    // Sleep quality = simple heuristic: (%N3 + %REM) - %W
    const qualityScore = Math.max(0, Math.min(100,
      parseFloat(percentages[3]) + parseFloat(percentages[4]) - parseFloat(percentages[0])
    ));

    return {
      totalSleepTime: (totalEpochs * 30 / 60).toFixed(1), // in minutes
      percentages,
      qualityScore: qualityScore.toFixed(1)
    };
  };

  // ---------------------- API Call ----------------------
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

  // ---------------------- Chart Config ----------------------
  const getChartOptions = () => {
    if (!prediction) return {};

    const timePoints = Array.from({ length: prediction.length }, (_, i) => i);
    const stageMap = {0: 'W', 1: 'N1', 2: 'N2', 3: 'N3', 4: 'R'};

    return {
      title: { text: 'Hypnogram (Sleep Stages)', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: timePoints,
        name: 'Epoch (30s)',
        nameLocation: 'middle',
        nameGap: 25
      },
      yAxis: {
        type: 'value',
        inverse:true,
        min: 0,
        max: 4,
        interval: 1,
        axisLabel: {
          formatter: function (value) {
            return stageMap[value] || value;
          }
        },
        
        name: 'Stage',
        nameLocation: 'middle',
        nameGap: 40
      },
      series: [{
        data: prediction,
        type: 'line',
        step: 'middle',
        lineStyle: { width: 2 },
        symbol: 'circle',
        symbolSize: 4
      }],
      dataZoom: [{ type: 'inside' }],
      toolbox: { feature: { dataZoom: {}, restore: {}, saveAsImage: {} } },
    };
  };

  // ---------------------- Sleep stats ----------------------
  const stats = prediction ? getSleepStats(prediction) : null;

  // ---------------------- UI ----------------------
  return (
    <div style={{
      fontFamily: "Arial, sans-serif",
      padding: "2rem",
      maxWidth: "100%",
      margin: "0 auto"
    }}>
      <h2 style={{textAlign: "center", marginBottom: "2rem"}}>🧠 Sleep Analysis Dashboard</h2>

      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        <div style={{ flex: "1 1 300px" }}>
          <label>Channel Name:</label>
          <input
            type="text"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
          />

          <label>Sampling Frequency (Hz):</label>
          <input
            type="number"
            value={sfreq}
            onChange={(e) => setSfreq(parseInt(e.target.value))}
            style={{ width: "100%", padding: "0.5rem" }}
          />

          <button 
            onClick={handlePredict}
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              marginTop: "1rem",
              background: "#007BFF",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Predicting..." : "▶️ Run Prediction"}
          </button>

          {errorMsg && <p style={{ color: "red", marginTop: "1rem" }}>{errorMsg}</p>}
        </div>

        {/* {stats && (
          <div style={{ flex: "2 1 600px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
            <div style={cardStyle}>
              <h4>Total Sleep Time</h4>
              <p>{stats.totalSleepTime} min</p>
            </div>
            <div style={cardStyle}>
              <h4>Sleep Quality</h4>
              <p>{stats.qualityScore} / 100</p>
            </div>
            {Object.entries(stats.percentages).map(([stage, pct]) => (
              <div key={stage} style={cardStyle}>
                <h4>Stage {stageMap(stage)}</h4>
                <p>{pct}%</p>
              </div>
            ))}
          </div>
        )} */}
      </div>

      {prediction && (
        <div style={{ marginTop: "2rem",width:"100%"  }}>
          <ReactECharts option={getChartOptions()} style={{ height: "400px" }} />
        </div>
      )}
    </div>
  );
}

// ---------------------- Helpers ----------------------
const cardStyle = {
  background: "#f8f9fa",
  padding: "1rem",
  borderRadius: "8px",
  boxShadow: "0 0 6px rgba(0,0,0,0.1)",
  textAlign: "center"
};

const stageMap = (val) => ({0:'W',1:'N1',2:'N2',3:'N3',4:'R'})[val] || val;
