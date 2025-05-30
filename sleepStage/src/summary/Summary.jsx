
import React, { useState, useEffect } from "react";
import "./summary.css";
import Spinner from "../spinner/Spinner";
import axios from "axios";

const Summary = () => {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAndUploadPDF = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          "http://localhost:8000/get_summary_pdf/",
          { withCredentials: true }
        );
        await handleFileUpload(response.data);
      } catch (err) {
        setError("Failed to load PDF: " + err.message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndUploadPDF();
  }, []);

  const handleFileUpload = async (file) => {
    setIsLoading(true);
    setError(null);
    setReportData(null);

    const personalInfo = file.personal_info;
    const spo2_pr_metrics = file.spo2_pr_metrics;
    const spo2_summary = file.spo2_summary;
    const odi_info = file.odi_info;
    const thresholds = file.thresholds;
    console.log(personalInfo);

    try {
      const simulatedData = {
        patientInfo: {
          name: personalInfo.Name,
          age: personalInfo.Age,
          sex: personalInfo.Sex,
          startTime: personalInfo["Start time"],
          endTime: personalInfo["End time"],
          duration: personalInfo["Duration"],
          validTime: personalInfo["Valid Time"],
        },
        spo2Summary: [
          {
            range: "95-100",
            duration: spo2_summary["95-100"].Duration,
            total: spo2_summary["95-100"]["%Total"],
            events: spo2_summary["95-100"]["Events (ODI4%)"],
          },
          {
            range: "89-94",
            duration: spo2_summary["89-94"].Duration,
            total: spo2_summary["89-94"]["%Total"],
            events: spo2_summary["89-94"]["Events (ODI4%)"],
          },
          {
            range: "80-88",
            duration: spo2_summary["80-88"].Duration,
            total: spo2_summary["80-88"]["%Total"],
            events: spo2_summary["80-88"]["Events (ODI4%)"],
          },
          {
            range: "70-79",
            duration: spo2_summary["70-79"].Duration,
            total: spo2_summary["70-79"]["%Total"],
            events: spo2_summary["70-79"]["Events (ODI4%)"],
          },
          {
            range: "<70",
            duration: spo2_summary["<70"].Duration,
            total: spo2_summary["<70"]["%Total"],
            events: spo2_summary["<70"]["Events (ODI4%)"],
          },
          {
            range: "Total",
            duration: spo2_summary["Total"].Duration,
            total: spo2_summary["Total"]["%Total"],
            events: spo2_summary["Total"]["Events (ODI4%)"],
          },
        ],
        metrics: {
          spo2: {
            max: spo2_pr_metrics.SpO2.max,
            avg: spo2_pr_metrics.SpO2.avg,
            min: spo2_pr_metrics.SpO2.min,
          },
          pr: {
            max: spo2_pr_metrics.PR.max,
            avg: spo2_pr_metrics.PR.avg,
            min: spo2_pr_metrics.PR.min,
          },
        },
        odi4: {
          odiPerHour: odi_info["ODI4%"]["ODI 4%"],
          totalEvents: odi_info["ODI4%"]["Total ODI 4% Events"],
          timeInEvents: odi_info["ODI4%"]["Time in ODI 4% Events"],
          percentageTimeInEvents:
            odi_info["ODI4%"]["% of Time in ODI 4% Events"],
          avgEventDuration: odi_info["ODI4%"]["Avg ODI 4% Event Duration"],
        },
        odi3: {
          odiPerHour: odi_info["ODI3%"]["ODI 3%"],
          totalEvents: odi_info["ODI3%"]["Total ODI 3% Events"],
          timeInEvents: odi_info["ODI3%"]["Time in ODI 3% Events"],
          percentageTimeInEvents:
            odi_info["ODI3%"]["% of Time in ODI 3% Events"],
          avgEventDuration: odi_info["ODI3%"]["Avg ODI 3% Event Duration"],
        },
        thresholdData: {
          threshold: thresholds["SpO2 Threshold"],
          spo2: [
            {
              threshold: thresholds["SpO2 >"][0],
              duration: thresholds["SpO2 >"][1],
              total: thresholds["SpO2 >"][2],
            },
            {
              threshold: thresholds["SpO2 <="][0],
              duration: thresholds["SpO2 <="][1],
              total: thresholds["SpO2 <="][2],
            },
          ],
          pulseRate: [
            {
              threshold: thresholds["PR >"][0],
              duration: thresholds["PR >"][1],
              total: thresholds["PR >"][2],
            },
            {
              threshold: thresholds["PR <"][0],
              duration: thresholds["PR <"][1],
              total: thresholds["PR <"][2],
            },
          ],
        },
        definitions: {
          odi4: "ODI 4% (Oxygen Desaturation Index) is the number of times per hour of sleep that the blood's oxygen level drop by at least 4%.",
          odi4Event:
            "ODI 4% Event: a fall in oxygen saturation of at least 4% and persisting more than 10 seconds.",
          odi3: "ODI 3% (Oxygen Desaturation Index) is the number of times per hour of sleep that the blood's oxygen level drop by at least 3%.",
          odi3Event:
            "ODI 3% Event: a fall in oxygen saturation of at least 3% and persisting more than 10 seconds.",
          threshold:
            "Threshold is used to differentiate normal and abnormal SpO2 or PR readings.",
        },
      };

      setReportData(simulatedData);
    } catch (err) {
      setError("Failed to process PDF: " + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h1>Summary Report</h1>

      {isLoading && <Spinner />}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {reportData && (
        <div className="report">
          <section>
            <h2>Patient Information</h2>
            <table>
              <tbody>
                <tr>
                  <td>
                    <strong>Name</strong>
                  </td>
                  <td>{reportData.patientInfo.name}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Age</strong>
                  </td>
                  <td>{reportData.patientInfo.age}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Sex</strong>
                  </td>
                  <td>{reportData.patientInfo.sex}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Start time</strong>:
                  </td>
                  <td>{reportData.patientInfo.startTime}</td>
                </tr>
                <tr>
                  <td>
                    <strong>End time</strong>
                  </td>
                  <td>{reportData.patientInfo.endTime}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Duration</strong>
                  </td>
                  <td>{reportData.patientInfo.duration}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Valid Time</strong>
                  </td>
                  <td>{reportData.patientInfo.validTime}</td>
                </tr>
              </tbody>
            </table>
          </section>
          <section>
            <h2>SpO2 Summary</h2>
            <table
              border="1"
              cellPadding="5"
              style={{ width: "100%", borderCollapse: "collapse" }}
            >
              <thead>
                <tr>
                  <th>SpO2</th>
                  <th>Duration</th>
                  <th>%Total</th>
                  <th>Events (ODI4%)</th>
                </tr>
              </thead>
              <tbody>
                {reportData.spo2Summary.map((row, index) => (
                  <tr key={index}>
                    <td>{row.range}</td>
                    <td>{row.duration}</td>
                    <td>{row.total}</td>
                    <td>{row.events}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section>
            <h2>Max, Avg, Min Readings</h2>
            <table
              border="1"
              cellPadding="5"
         
            >
              <thead>
                <tr>
                  <th></th>
                  <th>Max</th>
                  <th>Avg</th>
                  <th>Min</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>SpO2</td>
                  <td>{reportData.metrics.spo2.max}</td>
                  <td>{reportData.metrics.spo2.avg}</td>
                  <td>{reportData.metrics.spo2.min}</td>
                </tr>
                <tr>
                  <td>PR</td>
                  <td>{reportData.metrics.pr.max}</td>
                  <td>{reportData.metrics.pr.avg}</td>
                  <td>{reportData.metrics.pr.min}</td>
                </tr>
              </tbody>
            </table>
          </section>
          <section className="odi-sections-row">
            <div className="odi-box">
              <h2>ODI 4%</h2>
              <table>
                <tbody>
                  <tr>
                    <td>ODI 4%</td>
                    <td>{reportData.odi4.odiPerHour}</td>
                  </tr>
                  <tr>
                    <td>Total ODI 4% Events</td>
                    <td>{reportData.odi4.totalEvents}</td>
                  </tr>
                  <tr>
                    <td>Time in ODI 4% Events</td>
                    <td>{reportData.odi4.timeInEvents}</td>
                  </tr>
                  <tr>
                    <td>% of Time in ODI 4% Events</td>
                    <td>{reportData.odi4.percentageTimeInEvents}</td>
                  </tr>
                  <tr>
                    <td>Avg ODI 4% Event Duration</td>
                    <td>{reportData.odi4.avgEventDuration}</td>
                  </tr>
                </tbody>
              </table>

              <p className="od-definition">
                <strong>Definition {reportData.definitions.odi4} </strong>
              </p>
              <p className="od-definition">
                <strong>
                  ODI 4% Event {reportData.definitions.odi4Event}{" "}
                </strong>
              </p>
            </div>
            <div className="odi-box">
              <h2>ODI 3%</h2>
              <table>
                <tbody>
                  <tr>
                    <td>ODI 3%:</td>
                    <td>{reportData.odi3.odiPerHour}</td>
                  </tr>
                  <tr>
                    <td>Total ODI 3% Events</td>
                    <td>{reportData.odi3.totalEvents}</td>
                  </tr>
                  <tr>
                    <td>Time in ODI 3% Events</td>
                    <td>{reportData.odi3.timeInEvents}</td>
                  </tr>
                  <tr>
                    <td>% of Time in ODI 3% Events</td>
                    <td>{reportData.odi3.percentageTimeInEvents}</td>
                  </tr>
                  <tr>
                    <td>Avg ODI 3% Event Duration</td>
                    <td>{reportData.odi3.avgEventDuration}</td>
                  </tr>
                </tbody>
              </table>

              <p className="od-definition">
                <strong>Definition {reportData.definitions.odi3}</strong>
              </p>
              <p className="od-definition">
                <strong>ODI 3% Event {reportData.definitions.odi3Event}</strong>
              </p>
            </div>
          </section>
          <section className="odi-sections-row">
            <div className="odi-box">
              <h2>Threshold Data</h2>
              <h3>SpO2 Threshold: {reportData.thresholdData.threshold}</h3>
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th>Duration</th>
                    <th>% Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.thresholdData.spo2.map((row, index) => (
                    <tr key={index}>
                      <td>{row.threshold}</td>
                      <td>{row.duration}</td>
                      <td>{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="odi-box">
              <h2>Pulse Rate Threshold</h2>
              <h3>
                Definition{" "}
                <p style={{ display: "inline" }}>
                  {reportData.definitions.threshold},
                </p>
              </h3>

              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th>Duration</th>
                    <th>% Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.thresholdData.pulseRate.map((row, index) => (
                    <tr key={index}>
                      <td>{row.threshold}</td>
                      <td>{row.duration}</td>
                      <td>{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Summary;
