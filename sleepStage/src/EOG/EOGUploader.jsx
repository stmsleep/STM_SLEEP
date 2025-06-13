import React, { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import axios from "axios";
import Spinner from "../spinner/Spinner";
import "../styles/Ecg.css";
import { parseNPZ } from "../utils/parseNpz";

import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';


export default function EOGUploader() {
  const [plotData, setPlotData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalMinutes, setTotalMinutes] = useState(0);

  const pageSize = 14400;

  const [qvarPage, setQvarPage] = useState(0);
  const [accPage, setAccPage] = useState(0);
  const [gyroPage, setGyroPage] = useState(0);

  const [qvarData, setQvarData] = useState(null);
  const [accData, setAccData] = useState(null);
  const [gyroData, setGyroData] = useState(null);

  useEffect(() => {
    async function fetchPoints() {
      setIsLoading(true);
      console.time("Total fetchPoints");
  
      try {
        console.time("1. Get Dropbox link");
        const { data: { url } } = await axios.get("http://localhost:8000/process_eog/", {
          withCredentials: true
        });
        console.timeEnd("1. Get Dropbox link");
  
        console.time("2. Download .npz file");
        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        console.timeEnd("2. Download .npz file");
  
        console.time("3. Parse .npz file");
        const npz = await parseNPZ(arrayBuffer);
        console.timeEnd("3. Parse .npz file");
  
        const parsedData = {
          time: npz['time'],
          qvar: npz['qvar'],
          a_x: npz['a_x'],
          a_y: npz['a_y'],
          a_z: npz['a_z'],
          g_x: npz['g_x'],
          g_y: npz['g_y'],
          g_z: npz['g_z'],
        };
  
        setPlotData(parsedData);
        setTotalMinutes(Math.ceil(parsedData.time.length / pageSize));
  
        updateQvarSlice(parsedData, 0);
        updateAccSlice(parsedData, 0);
        updateGyroSlice(parsedData, 0);
  
        console.timeEnd("Total fetchPoints");
      } catch (error) {
        console.error("Error while fetching:", error);
        const msg = error.response
          ? `Server responded with status ${error.response.status}: ${error.response.statusText}`
          : error.request
            ? "No response received from server. Please check your backend is running."
            : "Error during request: " + error.message;
        alert(msg);
      } finally {
        setIsLoading(false);
      }
    }
  
    fetchPoints();
  }, []);
  
  
  

  const updateQvarSlice = (data, pageIndex) => {
    const [start, end] = [pageIndex * pageSize, (pageIndex + 1) * pageSize];
    setQvarData({ time: data.time.slice(start, end), qvar: data.qvar.slice(start, end) });
    setQvarPage(pageIndex);
  };

  const updateAccSlice = (data, pageIndex) => {
    const [start, end] = [pageIndex * pageSize, (pageIndex + 1) * pageSize];
    setAccData({
      time: data.time.slice(start, end),
      a_x: data.a_x.slice(start, end),
      a_y: data.a_y.slice(start, end),
      a_z: data.a_z.slice(start, end),
    });
    setAccPage(pageIndex);
  };

  const updateGyroSlice = (data, pageIndex) => {
    const [start, end] = [pageIndex * pageSize, (pageIndex + 1) * pageSize];
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

  const getEChartOption = (title, xData, series) => ({
    renderer: 'canvas',
    title: { text: title },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    xAxis: { type: 'category', data: xData },
    yAxis: { type: 'value', scale: true },
    dataZoom: [
      { type: 'inside', zoomOnMouseWheel: true, moveOnMouseWheel: true, moveOnMouseMove: true, throttle: 50 }
    ],
    toolbox: {
      feature: { dataZoom: { yAxisIndex: 'none' }, restore: {} },
    },
    series,
  });

  return (
    <div className="ecg-wrapper">
      <h1 className="title">EOG Data</h1>
      {isLoading ? (
        <div className="ecg-loading-skeletons">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="chart-card">
              <Skeleton height={30} width={200} style={{ marginBottom: 10 }} />
              <Skeleton height={400} />
              <Skeleton height={40} width={`50%`} style={{ marginTop: 10 }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {qvarData && (
            <div className="chart-card">
              <ReactECharts
                option={getEChartOption("QVAR Signal", qvarData.time, [
                  { data: qvarData.qvar, type: 'line', name: 'QVAR', lineStyle: { color: '#2c3e50' } },
                ])}
                style={{ height: 400 }}
              />
              {renderSlider("QVAR Minute", qvarPage, (i) => updateQvarSlice(plotData, i))}
            </div>
          )}

          {accData && (
            <div className="chart-card">
              <ReactECharts
                option={getEChartOption("Accelerometer Signal", accData.time, [
                  { data: accData.a_x, type: 'line', name: 'A_X', lineStyle: { color: '#2c3e50' } },
                  { data: accData.a_y, type: 'line', name: 'A_Y', lineStyle: { color: '#2980b9' } },
                  { data: accData.a_z, type: 'line', name: 'A_Z', lineStyle: { color: '#27ae60' } },
                ])}
                style={{ height: 400 }}
              />
              {renderSlider("Accelerometer Minute", accPage, (i) => updateAccSlice(plotData, i))}
            </div>
          )}

          {gyroData && (
            <div className="chart-card">
              <ReactECharts
                option={getEChartOption("Gyroscope Signal", gyroData.time, [
                  { data: gyroData.g_x, type: 'line', name: 'G_X', lineStyle: { color: '#2c3e50' } },
                  { data: gyroData.g_y, type: 'line', name: 'G_Y', lineStyle: { color: '#c0392b' } },
                  { data: gyroData.g_z, type: 'line', name: 'G_Z', lineStyle: { color: '#8e44ad' } },
                ])}
                style={{ height: 400 }}
              />
              {renderSlider("Gyroscope Minute", gyroPage, (i) => updateGyroSlice(plotData, i))}
            </div>
          )}
        </>
      )}
    </div>
  );
}