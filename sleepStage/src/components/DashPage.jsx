// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { parseNPZ } from "../utils/parseNpz";
// import ReactECharts from "echarts-for-react";
// import Skeleton from "react-loading-skeleton";
// import "react-loading-skeleton/dist/skeleton.css";
// import Hypnogram from "../assets/hypnogram.png";
// import "../styles/DashPage.css";
// import { useNavigate } from "react-router-dom";
// function getEChartOption(title, xData, seriesArray) {
//   return {
//     title: {
//       text: title,
//       left: "center",
//       // ✅ Push title down
//     },
//     tooltip: {
//       trigger: "axis",
//     },
//     xAxis: {
//       type: "category",
//       data: xData,
//     },
//     yAxis: {
//       type: "value",
//       // name: "Signal",

//       nameLocation: "middle", // ✅ Show vertically
//       nameGap: 1000,
//       axisLabel: { show: false }, // ✅ now we show numbers
//       axisLine: { show: false },
//       splitLine: { show: false },
//       min: (value) => value.min - 10, // ✅ add padding below
//       max: (value) => value.max + 10, // ✅ add padding above
//     },

//     series: seriesArray,
//   };
// }

// function DashPage() {
//   const [avgHeartRate, setAvgHeartRate] = useState(null);
//   const [maxEyeMovement, setMaxEyeMovement] = useState(null);
//   const [heartChartData, setHeartChartData] = useState(null);
//   const [eyeChartData, setEyeChartData] = useState(null);
//   const [eyeTime, setEyeTime] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const cachedData = sessionStorage.getItem("dashboardData");
//     if (cachedData) {
//       const parsed = JSON.parse(cachedData);
//       setAvgHeartRate(parsed.avgHeartRate);
//       setHeartChartData(parsed.heartChartData);
//       setMaxEyeMovement(parsed.maxEyeMovement);
//       setEyeChartData(parsed.eyeChartData);
//       setLoading(false);
//     }
//     const fetchDashboard = async () => {
//       try {
//         const { data } = await axios.get("http://localhost:8000/dashboard/", {
//           withCredentials: true,
//         });

//         const heartUrl = data?.heart_file;
//         const eyeUrl = data?.eye_file;
//         let avg = null;
//         let heartChartData = null;
//         let max = null;
//         let eyeChartData = null;
//         // Heart Processing
//         if (heartUrl) {
//           const res = await fetch(heartUrl);
//           const buffer = await res.arrayBuffer();
//           const parsed = await parseNPZ(buffer);
//           let arr = parsed["qvar"] || parsed["data_corrected"] || [];

//           arr = arr.slice(60000, 63000);
//           console.log("ARRAY :", arr);
//           if (arr.length > 0) {
//             const sum = arr.reduce((a, b) => a + b, 0);
//             console.log("SUM : ", sum);

//             avg = sum / arr.length;

//             heartChartData = {
//               x: Array.from({ length: arr.length }, (_, i) => i),
//               y: arr,
//             };
//             setAvgHeartRate(avg.toFixed(2));
//             setHeartChartData(heartChartData);
//           }
//         }

//         // Eye Processing
//         if (eyeUrl) {
//           const res = await fetch(eyeUrl);
//           const buffer = await res.arrayBuffer();
//           const parsed = await parseNPZ(buffer);
//           console.log("EYE PARSED :", parsed);
//           let arr = parsed["eye_movement"] || parsed["qvar"] || [];
//           let time = parsed["time"] || [];
//           time = time.slice(0, 300);
//           setEyeTime(time);
//           console.log("eye array:", arr);
//           arr = arr.slice(20000, 20300);

//           if (arr.length > 0) {
//             max = -Math.min(...arr);
//             setMaxEyeMovement(max.toFixed(2));
//             eyeChartData = {
//               x: Array.from({ length: arr.length }, (_, i) => i),
//               y: arr,
//             };
//             setEyeChartData(eyeChartData);
//           }
//         }
//         if (avg != null && max != null && heartChartData) {
//           const store = {
//             avgHeartRate: avg.toFixed(2),
//             heartChartData: heartChartData,
//             maxEyeMovement: max.toFixed(2),
//             eyeChartData: eyeChartData,
//           };

//           sessionStorage.setItem("dashboardData", JSON.stringify(store));
//           console.log("EYE X: ", eyeTime);
//           console.log("EYE Y :", eyeChartData.y);
//         }
//       } catch (e) {
//         console.error("Error fetching dashboard data:", e);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDashboard(); // ✅ Called ONCE on mount only
//   }, []); // ✅ Don't include any state in dependency array

//   return (
//     <div className="wrapper">
//       <div className="signals">
//         {/* Hypnogram Image */}
//         <div className="eeg">
//           <img
//             onClick={() => navigate("/eeg")}
//             style={{ cursor: "pointer" }}
//             src={Hypnogram}
//             alt="Hypnogram"
//           />
//         </div>

//         {/* Body Signals Section */}
//         <div className="bodySignals">
//           {/* Eye Movement */}
//           <div
//             onClick={() => navigate("/eog")}
//             style={{ cursor: "pointer" }}
//             className="eog"
//           >
//             <h2>EOG</h2>
//             {/* <p>
//               Max Eye Movement:{" "}
//               {loading ? <Skeleton width={80} /> : maxEyeMovement}
//             </p> */}
//             {eyeChartData && (
//               <ReactECharts
//                 option={getEChartOption("Eye Signal", eyeChartData.x, [
//                   {
//                     data: eyeChartData.y,
//                     type: "line",
//                     name: "Eye Movement",
//                     smooth: true,
//                     symbol: "none", // ✅ cleaner line
//                     lineStyle: { color: "#3498db" },
//                   },
//                 ])}
//                 style={{ height: 100 }}
//               />
//             )}
//           </div>

//           {/* Heart / ECG */}
//           <div
//             onClick={() => navigate("/ecg")}
//             style={{ cursor: "pointer" }}
//             className="ecg"
//           >
//             <h2>ECG</h2>
//             {/* <p>
//               Avg Heart Rate:{" "}
//               {loading ? <Skeleton width={80} /> : `${avgHeartRate} bpm`}
//             </p> */}
//             {heartChartData && (
//               <ReactECharts
//                 option={{
//                   title: {
//                     text: "Heart Signal",
//                     left: "center",
//                   },
//                   tooltip: { trigger: "axis" },
//                   xAxis: { type: "category", data: heartChartData.x },
//                   yAxis: {
//                     type: "value",
//                     // name: "Signal",
//                     axisLabel: { show: false },
//                     axisLine: { show: false },
//                     splitLine: { show: false },
//                   },
//                   series: [
//                     {
//                       data: heartChartData.y,
//                       type: "line",
//                       name: "Heart Rate Signal",
//                       smooth: true,
//                       lineStyle: { color: "#e74c3c" },
//                       min: "dataMin",
//                       max: "dataMax",
//                     },
//                   ],
//                 }}
//                 style={{ height: 200 }}
//               />
//             )}
//           </div>

//           {/* Leg Placeholder */}
//           <div className="leg" onClick={()=>navigate("/heartrate")}>
//             <h2>Heart Rate</h2>
//             {/* <p>Coming soon</p> */}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default DashPage;


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

function DashPage() {
  const navigate = useNavigate();
  const [avgHeartRate, setAvgHeartRate] = useState(72.03);
  const [maxEyeMovement, setMaxEyeMovement] = useState(null);
  const [heartChartData, setHeartChartData] = useState(null);
  const [eyeChartData, setEyeChartData] = useState(null);
  const [sleepPrediction, setSleepPrediction] = useState(null);
  const [sleepStats, setSleepStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartDataExists,setChartDataEcist] = useState(false);

  const getSleepStats = (data) => {
    if (!data || data.length === 0) return null;
    const totalEpochs = data.length;
    const stageCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    data.forEach((stage) => stageCounts[stage]++);
    const percentages = Object.fromEntries(
      Object.entries(stageCounts).map(([k, v]) => [k, ((v / totalEpochs) * 100).toFixed(1)])
    );
    const qualityScore = Math.max(
      0,
      Math.min(100, parseFloat(percentages[3]) + parseFloat(percentages[4]) - parseFloat(percentages[0]))
    );
    return {
      totalSleepTime: (totalEpochs * 30 / 60).toFixed(1),
      percentages,
      qualityScore: qualityScore.toFixed(1),
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
          setChartDataEcist(true);
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
    {/* Hypnogram Full Width */}
    <div className="dashboard-container">
  {/* Hypnogram Full Width */}
      <div className="chart-full" onClick={() => navigate("/EEG")}>
        {loading ? (
          <Skeleton height={420} />
        ) : chartDataExists ? ( // Optional: Replace with your chart data check
          <ReactECharts option={getHypnogramOptions()} style={{ height: "420px" }} />
        ) : (
          <div className="no-chart-message">
            Go to Sleep Analysis to generate your hypnogram
          </div>
        )}
      </div>
    </div>


    {/* Pie + Heart */}
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
                    borderColor: '#fff',
                    borderWidth: 2
                  },
                  avoidLabelOverlap: false,
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

      <div
        className="gauge-chart"
        onClick={() => navigate("/heartrate")}
        style={{
          width: "100%",
          margin: "0 auto",
          padding: "1rem",
          background: "#f9f9f9",
          borderRadius: "1rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
  <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem", color: "#444" }}>
    Heart Rate
  </h2>
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
            radius: "100%",
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
              // icon: "rect", // or "rect"
              // length: "60%",
              // width: 10,
              itemStyle: {
                color: "#1a1818ff", // 🔴 Change this to your desired needle color
              },
            },

            
            splitLine: {
              distance: -20,
              length: 20,
              lineStyle: {
                color: "#000",
                width: 2,
              },
            },
            axisLabel: {
              distance: -30,
              color: "#333",
              fontSize: 14,
            },
            detail: {
              valueAnimation: true,
              formatter: "{value} bpm",
              fontSize: 24,
              color: "#111",
              offsetCenter: [0, "-20%"],
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

    {/* EEG & EOG Scrollable Section */}
    <div className="chart-row">
      <div className="signal-box" onClick={() => navigate("/ecg")}>
        <h3>ECG</h3>
        {loading || !heartChartData ? (
          <Skeleton height={200} />
        ) : (
          <ReactECharts
            option={getEChartOption("Heart Signal", heartChartData.x, [
              {
                data: heartChartData.y,
                type: "line",
                name: "Heart Rate",
                smooth: true,
                lineStyle: { color: "#e74c3c" },
              },
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
              {
                data: eyeChartData.y,
                type: "line",
                name: "Eye Movement",
                smooth: true,
                lineStyle: { color: "#3498db" },
                symbol: "none",
              },
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
