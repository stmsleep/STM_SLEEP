import axios from "axios";
import React, { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import ReactECharts from "echarts-for-react";
import "../styles/Ecg.css";
import { parseNPZ } from "../utils/parseNpz";

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
      console.time("Total fetchPoints");

      try {
        console.time("1. Get Dropbox link");

        const { data: { url } } = await axios.get("http://localhost:8000/process_ecg/", {
          withCredentials: true,
        });

        console.timeEnd("1. Get Dropbox link");

        console.time("2. Download .npz file");
        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        console.timeEnd("2. Download .npz file");

        console.time("3. Parse .npz file");
        const npz = await parseNPZ(arrayBuffer);
        console.timeEnd("3. Parse .npz file");

        const times = npz["time"] || npz["times"] || [];
        const data_corrected = npz["qvar"] || npz["data_corrected"] || [];

        setData({ times, data_corrected });
        setDisplayedData({
          times: times.slice(0, pageSize),
          data_corrected: data_corrected.slice(0, pageSize),
        });
        setTotalMinutes(Math.ceil(times.length / pageSize));
        setCurrentPage(0);

        console.timeEnd("Total fetchPoints");
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

  const getEChartOption = () => ({
    title: {
      text: "ECG Signal",
      left: "center"
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" }
    },
    xAxis: {
      type: "category",
      data: displayedData.times,
      name: "Time",
      axisLine: { onZero: false }
    },
    yAxis: {
      type: "value",
      name: "Amplitude"
    },
    series: [
      {
        name: "ECG",
        type: "line",
        showSymbol: false,
        data: displayedData.data_corrected,
        lineStyle: {
          color: "#2c3e50"
        }
      }
    ],
    grid: {
      left: "8%",
      right: "8%",
      bottom: "15%"
    },
    dataZoom: [
      {
        type: 'inside',
        zoomOnMouseWheel: true,
        moveOnMouseWheel: true,
        moveOnMouseMove: true,
        throttle: 50,
      }
    ],
    toolbox: {
      feature: {
        dataZoom: { yAxisIndex: 'none' },
        restore: {},
      },
    },
  });

  const renderSkeleton = () => (
    <div className="chart-card">
      <Skeleton height={400} />
      <Skeleton height={20} width="60%" style={{ marginTop: 12 }} />
      <Skeleton height={40} width="100%" style={{ marginTop: 20 }} />
    </div>
  );

  return (
    <div className="ecg-wrapper">
      <h1 className="title">ECG Data</h1>

      {isLoading ? (
        renderSkeleton()
      ) : (
        <>
          <div className="chart-card">
            <ReactECharts
              option={getEChartOption()}
              style={{ width: "100%", height: "400px" }}
              notMerge={true}
              lazyUpdate={true}
              theme={"light"}
              opts={{ renderer: "canvas" }}
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
