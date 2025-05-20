import axios from 'axios';
import React, { useState } from 'react';
import HeartRateChart from './HeartRateChart';
import './CSVUploader.css';

export default function CSVUploader() {
  const [file, setFile] = useState(null);
  const [prBpm, setprBpm] = useState([]);
  const [times, setTimes] = useState([]);
  const [message, setMessage] = useState('');

  function handleFileChange(e) {
    setFile(e.target.files[0]);
  }

  async function handleUpload() {
    if (!file) {
      setMessage("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/upload_csv/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      console.log("response: ", response.data.pr_bpm);

      if (response.status === 200) {
        setMessage(response.data.message || "Upload successful");
        setprBpm(response.data.pr_bpm || []);
        setTimes(response.data.times || []);
      } else {
        setMessage("Unexpected response");
      }

    } catch (error) {
      setMessage(error.response?.data?.error || 'Upload failed');
    }
  }

  return (
    <div className="csv-uploader-container">
      <h2 className="csv-uploader-heading">Upload CSV File</h2>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="csv-uploader-input"
        aria-label="Select CSV file"
      />
      <button onClick={handleUpload} className="csv-uploader-button" aria-label="Upload CSV file">
        Upload
      </button>
      <p className="csv-uploader-message" aria-live="polite">{message}</p>

      {prBpm.length > 0 && times.length > 0 && (
        <HeartRateChart prBpm={prBpm} times={times} />
      )}
    </div>
  );
}
