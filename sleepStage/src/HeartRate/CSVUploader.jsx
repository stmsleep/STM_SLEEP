import axios from "axios";
import React, { useEffect, useState } from "react";
import HeartRateChart from "./HeartRateChart";
import "./CSVUploader.css";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { parseNPZ } from "../utils/parseNpz"; // Ensure this uses fflate + numpy-parser

export default function CSVUploader() {
  const [spo2, setspo2] = useState([]);
  const [avg_sleep, setSleepBeat] = useState(null);
  const [prBpm, setprBpm] = useState([]);
  const [times, setTimes] = useState([]);
  const [message, setMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchPoints() {
      setIsLoading(true);
      console.time("Total fetchPoints");

      try {
        console.time("1. Get Dropbox link");
        const { data: { url } } = await axios.get("http://localhost:8000/upload_csv/", {
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

        const time = Array.from(npz["time"] || []);
        const pr_bpm = Array.from(npz["pr_bpm"] || []);
        const spo2 = Array.from(npz["spo2"] || []);

        // ✅ Compute average from the FIRST 300 points only
        const firstFiveMinPR = pr_bpm.slice(0, 300);
        const sum = firstFiveMinPR.reduce((acc, val) => acc + val, 0);
        const avgSleep = firstFiveMinPR.length > 0 ? sum / firstFiveMinPR.length : null;

        setTimes(time);
        setprBpm(pr_bpm);
        setspo2(spo2);
        setSleepBeat(avgSleep);

        console.timeEnd("Total fetchPoints");
      } catch (error) {
        console.error(error);
        setMessage(error.response?.data?.error || "Upload failed");
      }
      setIsLoading(false);
    }

    fetchPoints();
  }, []);

  const renderSkeletonChart = (title = "Loading Chart...") => (
    <div className="chart-card">
      <h2 className="title">{title}</h2>
      <Skeleton height={400} />
      <Skeleton height={20} width="50%" style={{ marginTop: 10 }} />
    </div>
  );

  return (
    <div className="uploader-container">
      <h1 className="title">PR BPM</h1>

      {isLoading ? (
        <>
          {renderSkeletonChart("PR BPM Chart")}
          {renderSkeletonChart("SpO2 Chart")}
        </>
      ) : (
        <>
          <p className="csv-uploader-message" aria-live="polite">
            {message}
          </p>

          {prBpm.length > 0 && times.length > 0 && (
            <HeartRateChart prBpm={prBpm} times={times} avg_sleep={avg_sleep} />
          )}

          <h1 className="title">SpO2 Chart</h1>
          <br />
          {spo2.length > 0 && times.length > 0 && (
            <HeartRateChart prBpm={spo2} times={times} />
          )}
        </>
      )}
    </div>
  );
}
