import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import axios from "axios";
import "./EOGUploader.css";
import Spinner from "../spinner/Spinner";

export default function EOGUploader() {
  const [plotData, setPlotData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function FetchPoints() {
      setIsLoading(true);
      try {
        const response = await axios.get("http://localhost:8000/process_eog/", {
          withCredentials: true,
        });
        if (response.status === 200) {
          setPlotData(response.data);
        } else {
          alert("Failed Fetching Data!..");
        }
      } catch (error) {
        alert("Failed Fetching data " + error.message);
      }
      setIsLoading(false);
    }
    FetchPoints();
  }, []);

  return (
    <div className="eog-container">
      <h2>Eye Movement (EOG)</h2>

      {isLoading && (
        <div>
          <Spinner />
          <p style={{ textAlign: "center", fontWeight: "bold" }}>
            This may take some time.. Please stay connect!
          </p>
        </div>
      )}

      {plotData && (
        <div className="plot-section">
          <h3>QVAR Signal Plot</h3>
          <div className="plot-wrapper">
            <Plot
              data={[
                {
                  x: plotData.time,
                  y: plotData.qvar,
                  type: "scatter",
                  mode: "lines",
                  name: "QVAR",
                  line: { color: "black" },
                },
              ]}
              layout={{
                title: "",
                xaxis: { title: "Time (s)" },
                yaxis: { title: "LSB" },
                height: 400,
                autosize: true,
                margin: { l: 50, r: 50, t: 20, b: 40 },
              }}
              useResizeHandler
              style={{ width: "100%" }}
            />
          </div>

          <h3>Accelerometer Plot</h3>
          <div className="plot-wrapper">
            <Plot
              data={[
                {
                  x: plotData.time,
                  y: plotData.a_x,
                  type: "scatter",
                  mode: "lines",
                  name: "A_X",
                  line: { color: "red" },
                },
                {
                  x: plotData.time,
                  y: plotData.a_y,
                  type: "scatter",
                  mode: "lines",
                  name: "A_Y",
                  line: { color: "green" },
                },
                {
                  x: plotData.time,
                  y: plotData.a_z,
                  type: "scatter",
                  mode: "lines",
                  name: "A_Z",
                  line: { color: "blue" },
                },
              ]}
              layout={{
                title: "",
                height: 400,
                xaxis: { title: "Time (s)" },
                yaxis: { title: "Acceleration (mg)" },
                showlegend: true,
                autosize: true,
                margin: { l: 50, r: 50, t: 20, b: 40 },
              }}
              useResizeHandler
              style={{ width: "100%" }}
            />
          </div>

          <h3>Gyroscope Plot</h3>
          <div className="plot-wrapper">
            <Plot
              data={[
                {
                  x: plotData.time,
                  y: plotData.g_x,
                  type: "scatter",
                  mode: "lines",
                  name: "G_X",
                  line: { color: "orange" },
                },
                {
                  x: plotData.time,
                  y: plotData.g_y,
                  type: "scatter",
                  mode: "lines",
                  name: "G_Y",
                  line: { color: "purple" },
                },
                {
                  x: plotData.time,
                  y: plotData.g_z,
                  type: "scatter",
                  mode: "lines",
                  name: "G_Z",
                  line: { color: "brown" },
                },
              ]}
              layout={{
                title: "",
                height: 400,
                xaxis: { title: "Time (s)" },
                yaxis: { title: "Gyroscope (dps)" },
                showlegend: true,
                autosize: true,
                margin: { l: 50, r: 50, t: 20, b: 40 },
              }}
              useResizeHandler
              style={{ width: "100%" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
