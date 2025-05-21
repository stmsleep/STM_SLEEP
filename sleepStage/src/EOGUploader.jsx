import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import axios from 'axios';
import './EOGUploader.css'; // <- import your stylesheet here

export default function EOGUploader() {
  const [file, setFile] = useState(null);
  const [plotData, setPlotData] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUploadClick = async () => {
    if (!file) {
      alert("Please select a .txt file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await axios.post("http://localhost:8000/process_eog/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPlotData(res.data);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="eog-container">
      <h2>Upload .txt Sensor File</h2>
      <input type="file" accept=".txt" onChange={handleFileChange} />
      <button onClick={handleUploadClick} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {plotData && (
        <div className="plot-section">
          <h3>QVAR Signal Plot</h3>
          <div className="plot-wrapper">
            <Plot
              data={[
                {
                  x: plotData.time,
                  y: plotData.qvar,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'QVAR',
                  line: { color: 'black' }
                }
              ]}
              layout={{
                title: '',
                xaxis: { title: 'Time (s)' },
                yaxis: { title: 'LSB' },
                height: 400,
                autosize: true,
                margin: { l: 50, r: 50, t: 20, b: 40 }
              }}
              useResizeHandler
              style={{ width: "100%" }}
            />
          </div>

          <h3>Accelerometer & Gyroscope Plot</h3>
          <div className="plot-wrapper">
            <Plot
              data={[
                {
                  x: plotData.time,
                  y: plotData.a_x,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'A_X',
                  line: { color: 'red' }
                },
                {
                  x: plotData.time,
                  y: plotData.a_y,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'A_Y',
                  line: { color: 'green' }
                },
                {
                  x: plotData.time,
                  y: plotData.a_z,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'A_Z',
                  line: { color: 'blue' }
                },
                {
                  x: plotData.time,
                  y: plotData.g_x,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'G_X',
                  yaxis: 'y2',
                  line: { color: 'orange' }
                },
                {
                  x: plotData.time,
                  y: plotData.g_y,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'G_Y',
                  yaxis: 'y2',
                  line: { color: 'purple' }
                },
                {
                  x: plotData.time,
                  y: plotData.g_z,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'G_Z',
                  yaxis: 'y2',
                  line: { color: 'brown' }
                },
              ]}
              layout={{
                title: '',
                height: 600,
                xaxis: { title: 'Time (s)' },
                yaxis: { title: 'Acceleration (mg)' },
                yaxis2: {
                  title: 'Gyroscope (dps)',
                  overlaying: 'y',
                  side: 'right'
                },
                showlegend: true,
                autosize: true,
                margin: { l: 50, r: 60, t: 20, b: 40 }
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
