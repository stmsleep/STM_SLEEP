import React from "react";
import "../styles/Dashboard.css";

export default function Dashboard({ onNext }) {
  return (
    <div className="container">
      <h1>Welcome to Your Sleep Insights</h1>
      <p>Track, understand, and improve your sleep using smart sensor data.</p>

      <h2>Inference Summary</h2>
      <div className="insight-box">
        <p><strong>Your overall sleep quality is moderate.</strong> You had around 6 hours and 42 minutes of sleep, which is slightly below the recommended duration of 7–8 hours for adults.</p>
        <p>Your <strong>average heart rate</strong> during sleep was 72 BPM, which is within normal range. The <strong>ODI index</strong> (4.5) indicates mild oxygen desaturation events, possibly suggesting early signs of sleep-disordered breathing.</p>
        <p><strong>SpO2 drops</strong> were detected 5 times, which may warrant monitoring over time, especially if you feel daytime fatigue. You spent more time in <strong>light sleep</strong> (40%) compared to <strong>deep sleep</strong> (25%), which may affect body recovery and immune function.</p>
      </div>

      <h2>What This Dashboard Tells You</h2>
      <div className="info-section">
        <p>This dashboard analyzes data from ECG and EOG signals to help you understand your sleep better. Key areas include duration, sleep stages, oxygen events, and heart rate trends.</p>
      </div>

      <h2>Sleep Stage Breakdown</h2>
      <div className="grid">
        <div className="card">
          <h3>Light Sleep</h3>
          <p>40% - Transitional phase helping the body prepare for deeper stages. Too much light sleep can indicate restlessness.</p>
        </div>
        <div className="card">
          <h3>Deep Sleep</h3>
          <p>25% - Essential for body recovery, immune support, and hormone regulation.</p>
        </div>
        <div className="card">
          <h3>REM Sleep</h3>
          <p>15% - Crucial for memory and emotion regulation. Eye movement and dreams occur here.</p>
        </div>
        <div className="card">
          <h3>Awake</h3>
          <p>20% - Short awakenings are normal. Excessive awakenings reduce sleep quality.</p>
        </div>
      </div>

      <h2>Summary of Sensor Data</h2>
      <div className="grid">
        <div className="card">
          <h3>Total Sleep Time</h3>
          <p>6h 42m</p>
        </div>
        <div className="card">
          <h3>Avg Heart Rate</h3>
          <p>72 BPM</p>
        </div>
        <div className="card">
          <h3>ODI Index</h3>
          <p>4.5</p>
        </div>
        <div className="card">
          <h3>SpO2 Drops</h3>
          <p>5 Events</p>
        </div>
      </div>

      <h2>What You Can Do</h2>
      <div className="insights">
        <ul>
          <li>Maintain a consistent bedtime and wake-up time.</li>
          <li>Avoid screens and heavy meals 1 hour before sleep.</li>
          <li>Keep your sleeping environment quiet and dark.</li>
          <li>Monitor ODI trends and consult a professional if values increase.</li>
        </ul>
      </div>

      <h2>Recent Sleep Reports</h2>
      <table className="history-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Report</th>
            <th>Duration</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>10 June 2025</td>
            <td>Sleep Report</td>
            <td>6h 42m</td>
            <td><button>PDF</button></td>
          </tr>
          <tr>
            <td>08 June 2025</td>
            <td>Sleep Report</td>
            <td>7h 10m</td>
            <td><button>PDF</button></td>
          </tr>
        </tbody>
      </table>

      <div className="footer">
        <p>
          This dashboard uses physiological data to help you sleep better. Keep tracking nightly changes to build consistent, healthy sleep habits.
        </p>
      </div>
    </div>
  );
}
