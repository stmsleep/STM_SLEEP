
import axios from "axios";
import React, { useEffect, useState } from "react";
import HeartRateChart from "./HeartRateChart";
import "./CSVUploader.css";
import Spinner from "../spinner/Spinner";

export default function CSVUploader() {
  const [prBpm, setprBpm] = useState([]);
  const [spo2,setspo2] = useState([]);
  const [times, setTimes] = useState([]);
  const [message, setMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchPoints() {
      setIsLoading(true);
      try {
        const response = await axios.get("http://localhost:8000/upload_csv/", {
          withCredentials: true,
        });

        const { time, spo2, pr_bpm } = response.data;

        if (response.status === 200) {
          setprBpm(pr_bpm || []);
          setTimes(time || []);
          setspo2(spo2||[]);
        } else {
          setMessage("Unexpected response");
        }
      } catch (error) {
        console.log(error);
        setMessage(error.response?.data?.error || "Upload failed");
      }
      setIsLoading(false);
    }
    fetchPoints();
  }, []);


  return (
    <div className="uploader-container">
      <h1 className = "title">PR BPM</h1>


      {isLoading && <Spinner />}

      <p className="csv-uploader-message" aria-live="polite">
        {message}
      </p>

      {prBpm.length > 0 && times.length > 0 && (
        <HeartRateChart prBpm={prBpm} times={times} />
      )}

      <h1 className = "title">SpO2 Chart</h1>
      <br />
      {prBpm.length > 0 && times.length > 0 && (
        <HeartRateChart prBpm={spo2} times={times} />
      )}

    </div>
  );
}
