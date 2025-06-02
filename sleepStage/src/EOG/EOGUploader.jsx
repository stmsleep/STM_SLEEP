import React, { useEffect, useState, useMemo } from "react";
import Plot from "react-plotly.js";
import axios from "axios";
import "./EOGUploader.css";
import Spinner from "../spinner/Spinner";

export default function EOGUploader() {
  const [plotData, setPlotData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);


  const [displayedData, setDisplayedData] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);

  const pageSize = 14400;

  useEffect(() => {
    async function fetchPoints() {
      setIsLoading(true);
      try {
        const response = await axios.get("http://localhost:8000/process_eog/", {
          withCredentials: true,
        });
        if (response.status === 200) {
          setPlotData(response.data);

    
          const { time, qvar, a_x, a_y, a_z, g_x, g_y, g_z } = response.data;
          setDisplayedData({
            time: time.slice(0, pageSize),
            qvar: qvar.slice(0, pageSize),
            a_x: a_x.slice(0, pageSize),
            a_y: a_y.slice(0, pageSize),
            a_z: a_z.slice(0, pageSize),
            g_x: g_x.slice(0, pageSize),
            g_y: g_y.slice(0, pageSize),
            g_z: g_z.slice(0, pageSize),
          });

          setTotalMinutes(Math.ceil(time.length / pageSize));
          setCurrentPage(0);
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


  const loadPage = (pageIndex) => {
    if (!plotData) return;
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    setDisplayedData({
      time: plotData.time.slice(startIndex, endIndex),
      qvar: plotData.qvar.slice(startIndex, endIndex),
      a_x: plotData.a_x.slice(startIndex, endIndex),
      a_y: plotData.a_y.slice(startIndex, endIndex),
      a_z: plotData.a_z.slice(startIndex, endIndex),
      g_x: plotData.g_x.slice(startIndex, endIndex),
      g_y: plotData.g_y.slice(startIndex, endIndex),
      g_z: plotData.g_z.slice(startIndex, endIndex),
    });
    setCurrentPage(pageIndex);
  };

  const handleNext = () => {
    if ((currentPage + 1) * pageSize < plotData.time.length) {
      loadPage(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      loadPage(currentPage - 1);
    }
  };

  const handleReset = () => {
    loadPage(0);
  };

  const handleMinuteSelect = (event) => {
    const selectedMinute = parseInt(event.target.value, 10);
    loadPage(selectedMinute - 1);
  };

  const hasData = useMemo(() => plotData !== null, [plotData]);

  return (
    <div className="eog-container">
      <h2>Eye Movement (EOG)</h2>

      {isLoading && (
        <div>
          <Spinner />
          <p style={{ textAlign: "center", fontWeight: "bold" }}>
            This may take some time.. Please stay connected!
          </p>
        </div>
      )}

      {!isLoading && hasData && displayedData && (
        <div className="plot-section">
          <h3>QVAR Signal Plot</h3>
          <div className="plot-wrapper">
            <Plot
              data={[
                {
                  x: displayedData.time,
                  y: displayedData.qvar,
                  type: "scattergl",
                  mode: "lines",
                  name: "QVAR",
                  line: { color: "black" },
                },
              ]}
              layout={{
                xaxis: { title: "Time (s)" },
                yaxis: { title: "LSB" },
                height: 400,
                autosize: true,
                margin: { l: 50, r: 50, t: 20, b: 40 },
              }}
              config={{ displaylogo: false }}
              useResizeHandler
              style={{ width: "100%" }}
            />
          </div>

          <h3>Accelerometer Plot</h3>
          <div className="plot-wrapper">
            <Plot
              data={[
                {
                  x: displayedData.time,
                  y: displayedData.a_x,
                  type: "scattergl",
                  mode: "lines",
                  name: "A_X",
                  line: { color: "red" },
                },
                {
                  x: displayedData.time,
                  y: displayedData.a_y,
                  type: "scattergl",
                  mode: "lines",
                  name: "A_Y",
                  line: { color: "green" },
                },
                {
                  x: displayedData.time,
                  y: displayedData.a_z,
                  type: "scattergl",
                  mode: "lines",
                  name: "A_Z",
                  line: { color: "blue" },
                },
              ]}
              layout={{
                height: 400,
                xaxis: { title: "Time (s)" },
                yaxis: { title: "Acceleration (mg)" },
                showlegend: true,
                autosize: true,
                margin: { l: 50, r: 50, t: 20, b: 40 },
              }}
              config={{ displaylogo: false }}
              useResizeHandler
              style={{ width: "100%" }}
            />
          </div>

          <h3>Gyroscope Plot</h3>
          <div className="plot-wrapper">
            <Plot
              data={[
                {
                  x: displayedData.time,
                  y: displayedData.g_x,
                  type: "scattergl",
                  mode: "lines",
                  name: "G_X",
                  line: { color: "orange" },
                },
                {
                  x: displayedData.time,
                  y: displayedData.g_y,
                  type: "scattergl",
                  mode: "lines",
                  name: "G_Y",
                  line: { color: "purple" },
                },
                {
                  x: displayedData.time,
                  y: displayedData.g_z,
                  type: "scattergl",
                  mode: "lines",
                  name: "G_Z",
                  line: { color: "brown" },
                },
              ]}
              layout={{
                height: 400,
                xaxis: { title: "Time (s)" },
                yaxis: { title: "Gyroscope (dps)" },
                showlegend: true,
                autosize: true,
                margin: { l: 50, r: 50, t: 20, b: 40 },
              }}
              config={{ displaylogo: false }}
              useResizeHandler
              style={{ width: "100%" }}
            />
          </div>

          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              gap: "1rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={handlePrev}
              disabled={currentPage === 0}
              style={{
                padding: "8px 16px",
                background: currentPage === 0 ? "#9ca3af" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: currentPage === 0 ? "not-allowed" : "pointer",
              }}
            >
              Previous 1 Minute
            </button>

            <button
              onClick={handleReset}
              style={{
                padding: "8px 16px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Reset
            </button>

            <button
              onClick={handleNext}
              disabled={(currentPage + 1) * pageSize >= plotData.time.length}
              style={{
                padding: "8px 16px",
                background:
                  (currentPage + 1) * pageSize >= plotData.time.length ? "#9ca3af" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  (currentPage + 1) * pageSize >= plotData.time.length
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              Next 1 Minute
            </button>

            <div className="chart-container">
              <label style={{ marginRight: "0.5rem" }}>Go to Minute:</label>
              <select value={currentPage + 1} onChange={handleMinuteSelect}>
                {Array.from({ length: totalMinutes }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    Minute {index + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !hasData && (
        <p style={{ textAlign: "center", color: "red" }}>
          No EOG data available to display.
        </p>
      )}
    </div>
  );
}
