import React, { useEffect, useState } from "react";
import axios from "axios";
import { parseNPZ } from "../utils/parseNpz";
import ReactECharts from "echarts-for-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import Hypnogram from "../assets/hypnogram.png";
import "../styles/DashPage.css";
import { useNavigate } from "react-router-dom";
function getEChartOption(title, xData, seriesArray) {
  return {
    title: {
      text: title,
      left: "center",
      // ✅ Push title down
    },
    tooltip: {
      trigger: "axis",
    },
    xAxis: {
      type: "category",
      data: xData,
    },
    yAxis: {
      type: "value",
      // name: "Signal",

      nameLocation: "middle", // ✅ Show vertically
      nameGap: 1000,
      axisLabel: { show: false }, // ✅ now we show numbers
      axisLine: { show: false },
      splitLine: { show: false },
      min: (value) => value.min - 10, // ✅ add padding below
      max: (value) => value.max + 10, // ✅ add padding above
    },

    series: seriesArray,
  };
}

function DashPage() {
  const [avgHeartRate, setAvgHeartRate] = useState(null);
  const [maxEyeMovement, setMaxEyeMovement] = useState(null);
  const [heartChartData, setHeartChartData] = useState(null);
  const [eyeChartData, setEyeChartData] = useState(null);
  const [eyeTime, setEyeTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cachedData = sessionStorage.getItem("dashboardData");
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      setAvgHeartRate(parsed.avgHeartRate);
      setHeartChartData(parsed.heartChartData);
      setMaxEyeMovement(parsed.maxEyeMovement);
      setEyeChartData(parsed.eyeChartData);
      setLoading(false);
    }
    const fetchDashboard = async () => {
      try {
        const { data } = await axios.get("http://localhost:8000/dashboard/", {
          withCredentials: true,
        });

        const heartUrl = data?.heart_file;
        const eyeUrl = data?.eye_file;
        let avg = null;
        let heartChartData = null;
        let max = null;
        let eyeChartData = null;
        // Heart Processing
        if (heartUrl) {
          const res = await fetch(heartUrl);
          const buffer = await res.arrayBuffer();
          const parsed = await parseNPZ(buffer);
          let arr = parsed["qvar"] || parsed["data_corrected"] || [];

          arr = arr.slice(60000, 63000);
          console.log("ARRAY :", arr);
          if (arr.length > 0) {
            const sum = arr.reduce((a, b) => a + b, 0);
            console.log("SUM : ", sum);

            avg = sum / arr.length;

            heartChartData = {
              x: Array.from({ length: arr.length }, (_, i) => i),
              y: arr,
            };
            setAvgHeartRate(avg.toFixed(2));
            setHeartChartData(heartChartData);
          }
        }

        // Eye Processing
        if (eyeUrl) {
          const res = await fetch(eyeUrl);
          const buffer = await res.arrayBuffer();
          const parsed = await parseNPZ(buffer);
          console.log("EYE PARSED :", parsed);
          let arr = parsed["eye_movement"] || parsed["qvar"] || [];
          let time = parsed["time"] || [];
          time = time.slice(0, 300);
          setEyeTime(time);
          console.log("eye array:", arr);
          arr = arr.slice(20000, 20300);

          if (arr.length > 0) {
            max = -Math.min(...arr);
            setMaxEyeMovement(max.toFixed(2));
            eyeChartData = {
              x: Array.from({ length: arr.length }, (_, i) => i),
              y: arr,
            };
            setEyeChartData(eyeChartData);
          }
        }
        if (avg != null && max != null && heartChartData) {
          const store = {
            avgHeartRate: avg.toFixed(2),
            heartChartData: heartChartData,
            maxEyeMovement: max.toFixed(2),
            eyeChartData: eyeChartData,
          };

          sessionStorage.setItem("dashboardData", JSON.stringify(store));
          console.log("EYE X: ", eyeTime);
          console.log("EYE Y :", eyeChartData.y);
        }
      } catch (e) {
        console.error("Error fetching dashboard data:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard(); // ✅ Called ONCE on mount only
  }, []); // ✅ Don't include any state in dependency array

  return (
    <div className="wrapper">
      <div className="signals">
        {/* Hypnogram Image */}
        <div className="eeg">
          <img
            onClick={() => navigate("/eeg")}
            style={{ cursor: "pointer" }}
            src={Hypnogram}
            alt="Hypnogram"
          />
        </div>

        {/* Body Signals Section */}
        <div className="bodySignals">
          {/* Eye Movement */}
          <div
            onClick={() => navigate("/eog")}
            style={{ cursor: "pointer" }}
            className="eog"
          >
            <h2>EOG</h2>
            <p>
              Max Eye Movement:{" "}
              {loading ? <Skeleton width={80} /> : maxEyeMovement}
            </p>
            {eyeChartData && (
              <ReactECharts
                option={getEChartOption("Eye Signal", eyeChartData.x, [
                  {
                    data: eyeChartData.y,
                    type: "line",
                    name: "Eye Movement",
                    smooth: true,
                    symbol: "none", // ✅ cleaner line
                    lineStyle: { color: "#3498db" },
                  },
                ])}
                style={{ height: 100 }}
              />
            )}
          </div>

          {/* Heart / ECG */}
          <div
            onClick={() => navigate("/ecg")}
            style={{ cursor: "pointer" }}
            className="ecg"
          >
            <h2>ECG</h2>
            <p>
              Avg Heart Rate:{" "}
              {loading ? <Skeleton width={80} /> : `${avgHeartRate} bpm`}
            </p>
            {heartChartData && (
              <ReactECharts
                option={{
                  title: {
                    text: "Heart Signal",
                    left: "center",
                  },
                  tooltip: { trigger: "axis" },
                  xAxis: { type: "category", data: heartChartData.x },
                  yAxis: {
                    type: "value",
                    // name: "Signal",
                    axisLabel: { show: false },
                    axisLine: { show: false },
                    splitLine: { show: false },
                  },
                  series: [
                    {
                      data: heartChartData.y,
                      type: "line",
                      name: "Heart Rate Signal",
                      smooth: true,
                      lineStyle: { color: "#e74c3c" },
                      min: "dataMin",
                      max: "dataMax",
                    },
                  ],
                }}
                style={{ height: 200 }}
              />
            )}
          </div>

          {/* Leg Placeholder */}
          <div className="leg">
            <h2>Heart Rate</h2>
            {/* <p>Coming soon</p> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashPage;
