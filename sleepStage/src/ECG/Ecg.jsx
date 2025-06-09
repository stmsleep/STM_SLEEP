import axios from "axios";
import React, { useEffect, useState } from "react";
import Spinner from "../spinner/Spinner";
import Plot from "react-plotly.js";
import "../styles/Ecg.css";

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
        const response = await axios.get("http://localhost:8000/process_ecg/", {
          withCredentials: true,
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

  return (
    <div className="ecg-wrapper">
      <h1 className="title">ECG Data</h1>

      {isLoading ? (
        <Spinner />
      ) : (
        <>
        <br />
          <div className="chart-card">
            <Plot
              data={[
                {
                  x: displayedData.times,
                  y: displayedData.data_corrected,
                  type: "scatter",
                  mode: "lines",
                  line: { color: "#2c3e50" },
                },
              ]}
              layout={{
                title: "ECG Signal",
                xaxis: { title: "Time" },
                yaxis: { title: "Amplitude" },
                margin: { t: 40, r: 30, l: 50, b: 50 },
                paper_bgcolor: "white",
                plot_bgcolor: "white",
                autosize: true,
              }}
              style={{ width: "100%", height: "400px" }}
              config={{ responsive: true,displaylogo: false }}
            />
          </div>

          <div className="ecg-controls">
            <label htmlFor="ecg-slider" className="slider-label">
              Minute: {currentPage + 1} / {totalMinutes}
            </label>
            <input
              id="ecg-slider"
              type="range"
              min="1"
              max={totalMinutes}
              value={currentPage + 1}
              onChange={(e) => {
                const selectedMinute = parseInt(e.target.value, 10);
                loadPage(selectedMinute - 1);
              }}
              className="ecg-slider"
            />
          </div>
        </>
      )}
    </div>
  );
}
