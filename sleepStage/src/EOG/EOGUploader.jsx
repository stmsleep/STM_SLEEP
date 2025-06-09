import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import axios from "axios";
import Spinner from "../spinner/Spinner";
import "../styles/Ecg.css"; // Use same style file as ECG

export default function EOGUploader() {
  const [plotData, setPlotData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const pageSize = 14400;
  const [totalMinutes, setTotalMinutes] = useState(0);

  const [qvarPage, setQvarPage] = useState(0);
  const [accPage, setAccPage] = useState(0);
  const [gyroPage, setGyroPage] = useState(0);

  const [qvarData, setQvarData] = useState(null);
  const [accData, setAccData] = useState(null);
  const [gyroData, setGyroData] = useState(null);

  useEffect(() => {
    async function fetchPoints() {
      setIsLoading(true);
      try {
        const response = await axios.get("http://localhost:8000/process_eog/", {
          withCredentials: true,
        });
        if (response.status === 200) {
          setPlotData(response.data);

          const { time } = response.data;
          setTotalMinutes(Math.ceil(time.length / pageSize));

          updateQvarSlice(response.data, 0);
          updateAccSlice(response.data, 0);
          updateGyroSlice(response.data, 0);
        } else {
          alert("Failed Fetching Data!");
        }
      } catch (error) {
        alert("Failed Fetching Data: " + error.message);
      }
      setIsLoading(false);
    }

    fetchPoints();
  }, []);

  const updateQvarSlice = (data, pageIndex) => {
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    setQvarData({ time: data.time.slice(start, end), qvar: data.qvar.slice(start, end) });
    setQvarPage(pageIndex);
  };

  const updateAccSlice = (data, pageIndex) => {
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    setAccData({
      time: data.time.slice(start, end),
      a_x: data.a_x.slice(start, end),
      a_y: data.a_y.slice(start, end),
      a_z: data.a_z.slice(start, end),
    });
    setAccPage(pageIndex);
  };

  const updateGyroSlice = (data, pageIndex) => {
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    setGyroData({
      time: data.time.slice(start, end),
      g_x: data.g_x.slice(start, end),
      g_y: data.g_y.slice(start, end),
      g_z: data.g_z.slice(start, end),
    });
    setGyroPage(pageIndex);
  };

  const renderSlider = (label, currentPage, onChange) => (
    <div className="ecg-controls">
      <label className="slider-label">{label}: {currentPage + 1} / {totalMinutes}</label>
      <input
        type="range"
        min="1"
        max={totalMinutes}
        value={currentPage + 1}
        onChange={(e) => onChange(parseInt(e.target.value, 10) - 1)}
        className="ecg-slider"
      />
    </div>
  );

  return (
    <div className="ecg-wrapper">
      <h1 className="title">EOG Data</h1>
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          {qvarData && (
            <div className="chart-card">
              <Plot
                data={[{
                  x: qvarData.time,
                  y: qvarData.qvar,
                  type: "scatter",
                  mode: "lines",
                  line: { color: "#2c3e50" },
                  name: "QVAR",
                }]}
                layout={{
                  title: "QVAR Signal",
                  xaxis: { title: "Time" },
                  yaxis: { title: "QVAR" },
                  margin: { t: 40, r: 30, l: 50, b: 50 },
                  paper_bgcolor: "white",
                  plot_bgcolor: "white",
                }}
                style={{ width: "100%", height: "400px" }}
                config={{ responsive: true, displaylogo: false }}
              />
              {renderSlider("QVAR Minute", qvarPage, (i) => updateQvarSlice(plotData, i))}
            </div>
          )}

          {accData && (
            <div className="chart-card">
              <Plot
                data={[
                  {
                    x: accData.time,
                    y: accData.a_x,
                    type: "scatter",
                    mode: "lines",
                    name: "A_X",
                    line: { color: "#2c3e50" },
                  },
                  {
                    x: accData.time,
                    y: accData.a_y,
                    type: "scatter",
                    mode: "lines",
                    name: "A_Y",
                    line: { color: "#2980b9" },
                  },
                  {
                    x: accData.time,
                    y: accData.a_z,
                    type: "scatter",
                    mode: "lines",
                    name: "A_Z",
                    line: { color: "#27ae60" },
                  },
                ]}
                layout={{
                  title: "Accelerometer Signal",
                  xaxis: { title: "Time" },
                  yaxis: { title: "Acceleration" },
                  margin: { t: 40, r: 30, l: 50, b: 50 },
                  paper_bgcolor: "white",
                  plot_bgcolor: "white",
                }}
                style={{ width: "100%", height: "400px" }}
                config={{ responsive: true, displaylogo: false }}
              />
              {renderSlider("Accelerometer Minute", accPage, (i) => updateAccSlice(plotData, i))}
            </div>
          )}

          {gyroData && (
            <div className="chart-card">
              <Plot
                data={[
                  {
                    x: gyroData.time,
                    y: gyroData.g_x,
                    type: "scatter",
                    mode: "lines",
                    name: "G_X",
                    line: { color: "#2c3e50" },
                  },
                  {
                    x: gyroData.time,
                    y: gyroData.g_y,
                    type: "scatter",
                    mode: "lines",
                    name: "G_Y",
                    line: { color: "#c0392b" },
                  },
                  {
                    x: gyroData.time,
                    y: gyroData.g_z,
                    type: "scatter",
                    mode: "lines",
                    name: "G_Z",
                    line: { color: "#8e44ad" },
                  },
                ]}
                layout={{
                  title: "Gyroscope Signal",
                  xaxis: { title: "Time" },
                  yaxis: { title: "Gyro" },
                  margin: { t: 40, r: 30, l: 50, b: 50 },
                  paper_bgcolor: "white",
                  plot_bgcolor: "white",
                }}
                style={{ width: "100%", height: "400px" }}
                config={{ responsive: true, displaylogo: false }}
              />
              {renderSlider("Gyroscope Minute", gyroPage, (i) => updateGyroSlice(plotData, i))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
