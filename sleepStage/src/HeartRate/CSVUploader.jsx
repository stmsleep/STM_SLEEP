
import axios from "axios";
import React, { useEffect, useState } from "react";
import HeartRateChart from "./HeartRateChart";
import "./CSVUploader.css";
import Spinner from "../spinner/Spinner";

export default function CSVUploader() {
  const [prBpm, setprBpm] = useState([]);
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

        console.log("response: ", response.data.pr_bpm);

        if (response.status === 200) {
          setprBpm(response.data.pr_bpm || []);
          setTimes(response.data.times || []);
        } else {
          setMessage("Unexpected response");
        }
      } catch (error) {
        setMessage(error.response?.data?.error || "Upload failed");
      }
      setIsLoading(false);
    }
    fetchPoints();
  }, []);

  return (
    <div className="uploader-container">
      <h2>Pulse Rate(bpm)</h2>

      {isLoading && <Spinner />}

      <p className="csv-uploader-message" aria-live="polite">
        {message}
      </p>

      {prBpm.length > 0 && times.length > 0 && (
        <HeartRateChart prBpm={prBpm} times={times} />
      )}
    </div>
  );
}
