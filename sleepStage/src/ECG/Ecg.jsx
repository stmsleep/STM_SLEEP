import axios from "axios";
import React, { useEffect, useState } from "react";
import Spinner from "../spinner/Spinner";
import Plot from "react-plotly.js";
import '../dropdown.css';

export default function ECG() {
  const [data, setData] = useState({ times: [], data_corrected: [] });
  const [displayedData, setDisplayedData] = useState({ times: [], data_corrected: [] });
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [totalMinutes, setTotalMinutes] = useState(0);

  const pageSize = 14400;

  useEffect(() => {
    async function fetchPoints() {
      setIsLoading(true);
      try {
        const response = await axios.get("http://localhost:8000/process_ecg/",{
          withCredentials:true,
        });
        if (response.status === 200) {
          const { times, data_corrected } = response.data;
          console.log("Total points:", times.length);
          setData({ times, data_corrected });
          setDisplayedData({
            times: times.slice(0, pageSize),
            data_corrected: data_corrected.slice(0, pageSize),
          });
          setTotalMinutes(Math.ceil(times.length / pageSize));
          setCurrentPage(0);
        }
      } catch (error) {
        console.error("Error fetching ECG data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPoints();
  }, []);

  const loadPage = (pageIndex) => {
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    setDisplayedData({
      times: data.times.slice(startIndex, endIndex),
      data_corrected: data.data_corrected.slice(startIndex, endIndex),
    });
    setCurrentPage(pageIndex);
  };

  const handleNext = () => {
    if ((currentPage + 1) * pageSize < data.times.length) {
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

  return (
    <div className="container">
      <h1>ECG Data</h1>
      {isLoading && <Spinner />}
      {!isLoading && (
        <div className="chart-container">
          <Plot
            data={[
              {
                x: displayedData.times,
                y: displayedData.data_corrected,
                type: "scattergl",
                mode: "lines",
              },
            ]}
            layout={{
              title: `ECG - Page ${currentPage + 1}`,
              xaxis: { title: "Time", showgrid: true },
              yaxis: { title: "Voltage", showgrid: true },
              margin: { t: 40, l: 50, r: 40, b: 40 },
            }}
            config={{
              responsive: true,
              displayModeBar: true,
              displaylogo:false,
            }}
            style={{ width: "100%", height: "500px" }}
          />

          <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", alignItems: "center" }}>
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
              disabled={(currentPage + 1) * pageSize >= data.times.length}
              style={{
                padding: "8px 16px",
                background:
                  (currentPage + 1) * pageSize >= data.times.length ? "#9ca3af" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  (currentPage + 1) * pageSize >= data.times.length
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
    </div>
  );
}
