import React, { useEffect, useState } from "react";
import axios from "axios";
import { parseNPZ } from "../utils/parseNpz";
import ReactECharts from "echarts-for-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "../styles/DashPage.css";
import { useNavigate } from "react-router-dom";

function getEChartOption(title, xData, seriesArray) {
  return {
    title: { text: title, left: "center" },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: xData },
    yAxis: {
      type: "value",
      nameLocation: "middle",
      nameGap: 1000,
      axisLabel: { show: false },
      axisLine: { show: false },
      splitLine: { show: false },
      min: (value) => value.min - 10,
      max: (value) => value.max + 10,
    },
    series: seriesArray,
  };
}

const stageMap = (val) => ({ 0: "W", 1: "N1", 2: "N2", 3: "N3", 4: "R" }[val] || val);

function getEmojiStatus(score) {
  const numScore = parseFloat(score);
  if (numScore >= 80) return "😴 Excellent sleep quality";
  if (numScore >= 60) return "🙂 Fair sleep quality";
  return "😟 Poor sleep quality";
}

function countTransitions(data) {
  let transitions = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i] !== data[i - 1]) transitions++;
  }
  return transitions;
}

function DashPage() {
  const navigate = useNavigate();
  const [avgHeartRate, setAvgHeartRate] = useState(72.03);
  const [maxEyeMovement, setMaxEyeMovement] = useState(null);
  const [heartChartData, setHeartChartData] = useState(null);
  const [eyeChartData, setEyeChartData] = useState(null);
  const [sleepPrediction, setSleepPrediction] = useState(null);
  const [sleepStats, setSleepStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartDataExists, setChartDataExists] = useState(false);

  const getSleepStats = (data) => {
    if (!data || data.length === 0) return null;
    const totalEpochs = data.length;
    const stageCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };

    data.forEach((stage) => stageCounts[stage]++);

    const percentages = Object.fromEntries(
      Object.entries(stageCounts).map(([k, v]) => [k, ((v / totalEpochs) * 100).toFixed(1)])
    );

    const totalSleepEpochs = stageCounts[1] + stageCounts[2] + stageCounts[3] + stageCounts[4];
    const totalSleepTime = (totalSleepEpochs * 30 / 60).toFixed(1); // in minutes
    const sleepEfficiency = ((totalSleepEpochs / totalEpochs) * 100).toFixed(1);
    const qualityScore = Math.max(
      0,
      Math.min(100, parseFloat(percentages[3]) + parseFloat(percentages[4]) - parseFloat(percentages[0]))
    );

    const transitions = countTransitions(data);

    return {
      totalSleepTime,
      percentages,
      qualityScore: qualityScore.toFixed(1),
      sleepEfficiency,
      transitions
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get("http://localhost:8000/dashboard/", {
          withCredentials: true,
        });

        if (data?.heart_file) {
          const res = await fetch(data.heart_file);
          const buffer = await res.arrayBuffer();
          const parsed = await parseNPZ(buffer);
          let arr = parsed["qvar"] || parsed["data_corrected"] || [];
          arr = arr.slice(60000, 63000);
          if (arr.length > 0) {
            const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
            setAvgHeartRate(avg.toFixed(2));
          }
        }

        if (data?.ecg_file) {
          const res = await fetch(data.ecg_file);
          const buffer = await res.arrayBuffer();
          const parsed = await parseNPZ(buffer);
          let arr = parsed["qvar"] || parsed["data_corrected"] || [];
          arr = arr.slice(60000, 63000);
          if (arr.length > 0) {
            const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
            setHeartChartData({
              x: Array.from({ length: arr.length }, (_, i) => i),
              y: arr,
            });
          }
        }

        if (data?.eye_file) {
          const res = await fetch(data.eye_file);
          const buffer = await res.arrayBuffer();
          const parsed = await parseNPZ(buffer);
          let arr = parsed["eye_movement"] || parsed["qvar"] || [];
          arr = arr.slice(20000, 20300);
          if (arr.length > 0) {
            setMaxEyeMovement((-Math.min(...arr)).toFixed(2));
            setEyeChartData({
              x: Array.from({ length: arr.length }, (_, i) => i),
              y: arr,
            });
          }
        }

        const sleepRes = await axios.post(
          "http://localhost:8000/jarvis/",
          {
            channel_name: "T7",
            sfreq: 100,
            ssh_cmd: "ssh -o StrictHostKeyChecking=no -p 11214 root@ssha.jarvislabs.ai",
          },
          { withCredentials: true }
        );

        if (sleepRes.data.prediction) {
          setSleepPrediction(sleepRes.data.prediction);
          setSleepStats(getSleepStats(sleepRes.data.prediction));
          setChartDataExists(true);
        }
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getHypnogramOptions = () => {
    if (!sleepPrediction) return {};
    const timePoints = Array.from({ length: sleepPrediction.length }, (_, i) => i);
    return {
      title: { text: "Hypnogram (Sleep Stages)", left: "center" },
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: timePoints,
        name: "Epoch (30s)",
        nameLocation: "middle",
        nameGap: 25,
      },
      yAxis: {
        type: "value",
        inverse: true,
        min: 0,
        max: 4,
        interval: 1,
        axisLabel: {
          formatter: (val) => stageMap(val),
        },
        name: "Stage",
        nameLocation: "middle",
        nameGap: 40,
      },
      series: [
        {
          data: sleepPrediction,
          type: "line",
          step: "middle",
          lineStyle: { width: 2 },
          symbol: "circle",
          symbolSize: 4,
        },
      ],
      dataZoom: [{ type: "inside" }],
      toolbox: { feature: { dataZoom: {}, restore: {}, saveAsImage: {} } },
    };
  };

  return (
    <div className="dashboard-container">
      {/* Hypnogram */}
      <div className="chart-full" onClick={() => navigate("/EEG")}>
        {loading ? (
          <Skeleton height={420} />
        ) : chartDataExists ? (
          <ReactECharts option={getHypnogramOptions()} style={{ height: "420px" }} />
        ) : (
          <div className="no-chart-message">
            Go to Sleep Analysis to generate your hypnogram
          </div>
        )}
      </div>

      {/* Insights Panel */}
      {/* <div className="insights-box" style={{ background: "#fff", padding: "1rem", borderRadius: "1rem", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", marginTop: "1rem" }}>
        <h3>Sleep Insights</h3>
        {loading || !sleepStats ? (
          <Skeleton height={150} />
        ) : (
          <>
            <p>{getEmojiStatus(sleepStats.qualityScore)}</p>
            <ul>
              <li>Total Sleep Time: {sleepStats.totalSleepTime} min ({(sleepStats.totalSleepTime/60).toFixed(2)} hrs)</li>
              <li>Sleep Efficiency: {sleepStats.sleepEfficiency}%</li>
              <li>Deep Sleep: {sleepStats.percentages[3]}% of the night</li>
              <li>REM Sleep: {sleepStats.percentages[4]}% of the night</li>
              <li>Awake Time: {sleepStats.percentages[0]}%</li>
              <li>Sleep Stage Changes: {sleepStats.transitions} (more changes = more restlessness)</li>
              <li>Max Eye Movement (REM marker): {maxEyeMovement} units</li>
              <li>Average Heart Rate: {avgHeartRate} bpm</li>
            </ul>
          </>
        )}
      </div> */}
      <div className="sleep-analysis">
        <h3>Sleep Insights</h3>
        {loading || !sleepStats ? (
          <Skeleton height={150} />
        ) : (
          <>
            {/* <div
              className={`sleep-score ${
                sleepStats.qualityScore >= 80
                  ? "good"
                  : sleepStats.qualityScore >= 60
                  ? "fair"
                  : "poor"
              }`}
            >
              {getEmojiStatus(sleepStats.qualityScore)}
            </div> */}

            <div className="sleep-stats-grid">
              <div className="stat-card">
                <span className="stat-icon">⏱</span>
                <div className="stat-info">
                  <span className="stat-title">Total Sleep Time</span>
                  <span className="stat-value">
                    {sleepStats.totalSleepTime} min ({(sleepStats.totalSleepTime/60).toFixed(2)} hrs)
                  </span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">💤</span>
                <div className="stat-info">
                  <span className="stat-title">Sleep Efficiency</span>
                  <span className="stat-value">{sleepStats.sleepEfficiency}%</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🔄</span>
                <div className="stat-info">
                  <span className="stat-title">Stage Changes</span>
                  <span className="stat-value">{sleepStats.transitions}</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">👁</span>
                <div className="stat-info">
                  <span className="stat-title">Max Eye Movement</span>
                  <span className="stat-value">{maxEyeMovement} units</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>


      {/* Pie Chart + Heart Gauge */}
      <div className="chart-row">
        <div className="pie-chart">
          <h3 style={{ textAlign: "center" }}>Sleep Stage Distribution</h3>
          {loading || !sleepStats ? (
            <Skeleton height={250} />
          ) : (
            <ReactECharts
              option={{
                tooltip: { trigger: "item" },
                legend: { bottom: 0 },
                series: [
                  {
                    name: "Sleep Stages",
                    type: "pie",
                    radius: ["40%", "70%"],
                    itemStyle: {
                      borderRadius: 10,
                      borderColor: "#fff",
                      borderWidth: 2
                    },
                    label: { show: true, formatter: "{b}: {d}%" },
                    data: Object.entries(sleepStats.percentages).map(([stage, value]) => ({
                      name: stageMap(stage),
                      value: parseFloat(value),
                    })),
                  },
                ],
              }}
              style={{ height: 250 }}
            />
          )}
        </div>

        <div className="gauge-chart" onClick={() => navigate("/heartrate")}>
          <h2>Heart Rate</h2>
          {loading ? (
            <Skeleton height={300} />
          ) : (
            <ReactECharts
              option={{
                series: [
                  {
                    type: "gauge",
                    startAngle: 180,
                    endAngle: 0,
                    min: 40,
                    max: 120,
                    splitNumber: 8,
                    axisLine: {
                      lineStyle: {
                        width: 20,
                        color: [
                          [0.3, "#91cc75"],
                          [0.7, "#fac858"],
                          [1, "#ee6666"],
                        ],
                      },
                    },
                    pointer: {
                      itemStyle: { color: "#1a1818ff" },
                    },
                    detail: {
                      valueAnimation: true,
                      formatter: "{value} bpm",
                      fontSize: 24,
                      color: "#111",
                    },
                    data: [{ value: avgHeartRate }],
                  },
                ],
              }}
              style={{ height: 300 }}
            />
          )}
        </div>
      </div>

      {/* ECG & EOG */}
      <div className="chart-row">
        <div className="signal-box" onClick={() => navigate("/ecg")}>
          <h3>ECG</h3>
          {loading || !heartChartData ? (
            <Skeleton height={200} />
          ) : (
            <ReactECharts
              option={getEChartOption("Heart Signal", heartChartData.x, [
                { data: heartChartData.y, type: "line", name: "Heart Rate", smooth: true, lineStyle: { color: "#e74c3c" } },
              ])}
              style={{ height: 200 }}
            />
          )}
        </div>
        <div className="signal-box" onClick={() => navigate("/eog")}>
          <h3>EOG</h3>
          {loading || !eyeChartData ? (
            <Skeleton height={200} />
          ) : (
            <ReactECharts
              option={getEChartOption("Eye Signal", eyeChartData.x, [
                { data: eyeChartData.y, type: "line", name: "Eye Movement", smooth: true, lineStyle: { color: "#3498db" }, symbol: "none" },
              ])}
              style={{ height: 200 }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default DashPage;
