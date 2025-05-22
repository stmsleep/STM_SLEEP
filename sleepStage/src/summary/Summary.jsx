import React, { useState, useEffect } from 'react';
import './summary.css';
import Spinner from '../spinner/Spinner';

const Summary = () => {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReportData = async () => {
    setIsLoading(true);
    setError(null);
    setReportData(null);

    try {
      const res = await fetch('http://localhost:8000/get_summary_pdf/');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();

      setReportData(data);
    } catch (err) {
      setError("Failed to load report data from server: " + err.message);
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <h1>EMAY Summary Report</h1>

      {isLoading && <Spinner />}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {reportData && (
        <div className='report'>
          <section>
            <h2>Patient Information</h2>
            <table>
              <tbody>
                <tr><td><strong>Name:</strong></td><td>{reportData.patientInfo?.name || 'N/A'}</td></tr>
                <tr><td><strong>Age:</strong></td><td>{reportData.patientInfo?.age || 'N/A'}</td></tr>
                <tr><td><strong>Sex:</strong></td><td>{reportData.patientInfo?.sex || 'N/A'}</td></tr>
                <tr><td><strong>Start time</strong>:</td><td>{reportData.patientInfo?.startTime || 'N/A'}</td></tr>
                <tr><td><strong>End time:</strong></td><td>{reportData.patientInfo?.endTime || 'N/A'}</td></tr>
                <tr><td><strong>Duration:</strong></td><td>{reportData.patientInfo?.duration || 'N/A'}</td></tr>
                <tr><td><strong>Valid Time:</strong></td><td>{reportData.patientInfo?.validTime || 'N/A'}</td></tr>
              </tbody>
            </table>
          </section>

          {Array.isArray(reportData.spo2Summary) && reportData.spo2Summary.length > 0 && (
            <section>
              <h2>SpO2 Summary</h2>
              <table border="1" cellPadding="5" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
          )}

          <section>
            <h2>Max, Avg, Min Readings</h2>
            <table border="1" cellPadding="5" style={{ width: '50%', borderCollapse: 'collapse' }}>
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
                  <td>{reportData.metrics?.spo2?.max || 'N/A'}</td>
                  <td>{reportData.metrics?.spo2?.avg || 'N/A'}</td>
                  <td>{reportData.metrics?.spo2?.min || 'N/A'}</td>
                </tr>
                <tr>
                  <td>PR</td>
                  <td>{reportData.metrics?.pr?.max || 'N/A'}</td>
                  <td>{reportData.metrics?.pr?.avg || 'N/A'}</td>
                  <td>{reportData.metrics?.pr?.min || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className='odi-sections-row'>
            <div className='odi-box'>
              <h2>ODI 4%</h2>
              <table>
                <tbody>
                  <tr><td>ODI 4%:</td><td>{reportData.odi4?.odiPerHour || 'N/A'}</td></tr>
                  <tr><td>Total ODI 4% Events:</td><td>{reportData.odi4?.totalEvents || 'N/A'}</td></tr>
                  <tr><td>Time in ODI 4% Events:</td><td>{reportData.odi4?.timeInEvents || 'N/A'}</td></tr>
                  <tr><td>% of Time in ODI 4% Events:</td><td>{reportData.odi4?.percentageTimeInEvents || 'N/A'}</td></tr>
                  <tr><td>Avg ODI 4% Event Duration:</td><td>{reportData.odi4?.avgEventDuration || 'N/A'}</td></tr>
                </tbody>
              </table>
              <p className='od-definition'><strong>Definition: {reportData.definitions?.odi4 || 'N/A'}</strong></p>
              <p className='od-definition'><strong>ODI 4% Event: {reportData.definitions?.odi4Event || 'N/A'}</strong></p>
            </div>
            <div className='odi-box'>
              <h2>ODI 3%</h2>
              <table>
                <tbody>
                  <tr><td>ODI 3%:</td><td>{reportData.odi3?.odiPerHour || 'N/A'}</td></tr>
                  <tr><td>Total ODI 3% Events:</td><td>{reportData.odi3?.totalEvents || 'N/A'}</td></tr>
                  <tr><td>Time in ODI 3% Events:</td><td>{reportData.odi3?.timeInEvents || 'N/A'}</td></tr>
                  <tr><td>% of Time in ODI 3% Events:</td><td>{reportData.odi3?.percentageTimeInEvents || 'N/A'}</td></tr>
                  <tr><td>Avg ODI 3% Event Duration:</td><td>{reportData.odi3?.avgEventDuration || 'N/A'}</td></tr>
                </tbody>
              </table>
              <p className='od-definition'><strong>Definition: {reportData.definitions?.odi3 || 'N/A'}</strong></p>
              <p className='od-definition'><strong>ODI 3% Event: {reportData.definitions?.odi3Event || 'N/A'}</strong></p>
            </div>
          </section>

          <section className='odi-sections-row'>
            <div className='odi-box'>
              <h2>SpO2 Threshold: 94</h2>
              <table border="1" cellPadding="5" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th></th>
                    <th>Duration</th>
                    <th>% Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.thresholdData?.spo2?.map((row, index) => (
                    <tr key={index}>
                      <td>{row.threshold}</td>
                      <td>{row.duration}</td>
                      <td>{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className='odi-box'>
              <h2>Pulse Rate Threshold</h2>
              <h3>Definition: <p style={{ display: "inline" }}>{reportData.definitions?.threshold || 'N/A'}</p></h3>
              <table border="1" cellPadding="5" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th></th>
                    <th>Duration</th>
                    <th>% Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.thresholdData?.pulseRate?.map((row, index) => (
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

          {reportData.notes && (
            <section>
              <h2>Notes</h2>
              <p>{reportData.notes}</p>
            </section>
          )}

          {reportData.graphs && (
            <section>
              <h2>Graphs</h2>
              <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                <img src={reportData.graphs.spo2} alt="SpO2 Graph Placeholder" style={{ width: '48%', marginBottom: '20px' }} />
                <img src={reportData.graphs.pulseRate} alt="Pulse Rate Graph Placeholder" style={{ width: '48%', marginBottom: '20px' }} />
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default Summary;


























// import React, { useState, useEffect } from 'react';
// import './summary.css';
// import Spinner from '../spinner/Spinner';

// const Summary = () => {
//   const [reportData, setReportData] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);


//    useEffect(() => {
//     const fetchAndUploadPDF = async () => {
//       try {
//         setIsLoading(true);
//         const res = await fetch('http://localhost:8000/get_summary_pdf/');
//         const blob = await res.blob();
//         const file = new File([blob], 'report.pdf', { type: 'application/pdf' });
//         await handleFileUpload(file);
//       } catch (err) {
//         setError("Failed to load PDF: " + err.message);
//         console.error(err);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchAndUploadPDF();
//   }, []);

//   const handleFileUpload = async (file) => {
//     if (!file) return;

//     setIsLoading(true);
//     setError(null);
//     setReportData(null);

//     try {

//       const simulatedData = {
//         patientInfo: {
//           name: "sris",
//           age: "45 (1/1/1980)",
//           sex: "male",
//           startTime: "5/15/2025 6:57:05 AM",
//           endTime: "5/15/2025 8:22:40 AM",
//           duration: "01:25:35",
//           validTime: "01:25:27",
//         },
//         spo2Summary: [
//           { range: "95-100", duration: "01:25:27", total: "100%", events: "0" },
//           { range: "89-94", duration: "00:00:00", total: "0%", events: "0" },
//           { range: "80-88", duration: "00:00:00", total: "0%", events: "0" },
//           { range: "70-79", duration: "00:00:00", total: "0%", events: "0" },
//           { range: "<70", duration: "00:00:00", total: "0%", events: "0" },
//           { range: "Total", duration: "01:25:27", total: "100%", events: "0" },
//         ],
//         metrics: {
//           spo2: { max: 100, avg: 99, min: 97 },
//           pr: { max: 103, avg: 56, min: 47 },
//         },
//         odi4: {
//           odiPerHour: "$0.0/hr$",
//           totalEvents: 0,
//           timeInEvents: "00:00:00",
//           percentageTimeInEvents: "0%",
//           avgEventDuration: "00:00:00",
//         },
//         odi3: {
//           odiPerHour: "0.7/hr",
//           totalEvents: 1,
//           timeInEvents: "00:00:30",
//           percentageTimeInEvents: "1%",
//           avgEventDuration: "00:00:30",
//         },
//         thresholdData: {
//           spo2: [
//             { threshold: ">94", duration: "01:25:27", total: "100%" },
//             { threshold: "<=94", duration: "00:00:00", total: "0%" },
//           ],
//           pulseRate: [
//             { threshold: ">100", duration: "00:00:27", total: "1%" },
//             { threshold: "<60", duration: "01:18:45", total: "92%" },
//           ],
//         },
//         definitions: {
//           odi4: "ODI 4% (Oxygen Desaturation Index) is the number of times per hour of sleep that the blood's oxygen level drop by at least 4%.",
//           odi4Event: "ODI 4% Event: a fall in oxygen saturation of at least 4% and persisting more than 10 seconds.",
//           odi3: "ODI 3% (Oxygen Desaturation Index) is the number of times per hour of sleep that the blood's oxygen level drop by at least 3%.",
//           odi3Event: "ODI 3% Event: a fall in oxygen saturation of at least 3% and persisting more than 10 seconds.",
//           threshold: "Threshold is used to differentiate normal and abnormal SpO2 or PR readings.",
//         },
//       };

//       setReportData(simulatedData);
//     } catch (err) {
//       setError("Failed to process PDF: " + err.message);
//       console.error(err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
//       <h1>Summary Report</h1>

//       {isLoading && <Spinner/>}
//       {error && <p style={{ color: 'red' }}>Error: {error}</p>}

//       {reportData && (
//         <div className='report'>
//             <section>
//           <h2>Patient Information</h2>
//           <table>
//             <tbody>
//               <tr><td><strong>Name:</strong></td><td>{reportData.patientInfo.name}</td></tr>
//               <tr><td><strong>Age:</strong></td><td>{reportData.patientInfo.age}</td></tr>
//               <tr><td><strong>Sex:</strong></td><td>{reportData.patientInfo.sex}</td></tr>
//               <tr><td><strong>Start time</strong>:</td><td>{reportData.patientInfo.startTime}</td></tr>
//               <tr><td><strong>End time:</strong></td><td>{reportData.patientInfo.endTime}</td></tr>
//               <tr><td><strong>Duration:</strong></td><td>{reportData.patientInfo.duration}</td></tr>
//               <tr><td><strong>Valid Time:</strong></td><td>{reportData.patientInfo.validTime}</td></tr>
//             </tbody>
//           </table>
//             </section>
//             <section>
//           <h2>SpO2 Summary</h2>
//           <table border="1" cellPadding="5" style={{ width: '100%', borderCollapse: 'collapse' }}>
//             <thead>
//               <tr>
//                 <th>SpO2</th>
//                 <th>Duration</th>
//                 <th>%Total</th>
//                 <th>Events (ODI4%)</th>
//               </tr>
//             </thead>
//             <tbody>
//               {reportData.spo2Summary.map((row, index) => (
//                 <tr key={index}>
//                   <td>{row.range}</td>
//                   <td>{row.duration}</td>
//                   <td>{row.total}</td>
//                   <td>{row.events}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//                 </section>
//                 <section>
//           <h2>Max, Avg, Min Readings</h2>
//           <table border="1" cellPadding="5" style={{ width: '50%', borderCollapse: 'collapse' }}>
//             <thead>
//               <tr>
//                 <th></th>
//                 <th>Max</th>
//                 <th>Avg</th>
//                 <th>Min</th>
//               </tr>
//             </thead>
//             <tbody>
//               <tr>
//                 <td>SpO2</td>
//                 <td>{reportData.metrics.spo2.max}</td>
//                 <td>{reportData.metrics.spo2.avg}</td>
//                 <td>{reportData.metrics.spo2.min}</td>
//               </tr>
//               <tr>
//                 <td>PR</td>
//                 <td>{reportData.metrics.pr.max}</td>
//                 <td>{reportData.metrics.pr.avg}</td>
//                 <td>{reportData.metrics.pr.min}</td>
//               </tr>
//             </tbody>
//           </table>
//               </section>
//         <section className='odi-sections-row'>
//         <div className='odi-box'>
//           <h2>ODI 4%</h2>
//           <table>
//             <tbody>
//               <tr><td>ODI 4%:</td><td>{reportData.odi4.odiPerHour}</td></tr>
//               <tr><td>Total ODI 4% Events:</td><td>{reportData.odi4.totalEvents}</td></tr>
//               <tr><td>Time in ODI 4% Events:</td><td>{reportData.odi4.timeInEvents}</td></tr>
//               <tr><td>% of Time in ODI 4% Events:</td><td>{reportData.odi4.percentageTimeInEvents}</td></tr>
//               <tr><td>Avg ODI 4% Event Duration:</td><td>{reportData.odi4.avgEventDuration}</td></tr>
//             </tbody>
//           </table>
          
//           <p className='od-definition'><strong>Definition: {reportData.definitions.odi4} </strong></p>
//           <p className='od-definition'><strong>ODI 4% Event: {reportData.definitions.odi4Event} </strong></p>
//             </div>
//             <div className='odi-box'>
//           <h2>ODI 3%</h2>
//           <table>
//             <tbody>
//               <tr><td>ODI 3%:</td><td>{reportData.odi3.odiPerHour}</td></tr>
//               <tr><td>Total ODI 3% Events:</td><td>{reportData.odi3.totalEvents}</td></tr>
//               <tr><td>Time in ODI 3% Events:</td><td>{reportData.odi3.timeInEvents}</td></tr>
//               <tr><td>% of Time in ODI 3% Events:</td><td>{reportData.odi3.percentageTimeInEvents}</td></tr>
//               <tr><td>Avg ODI 3% Event Duration:</td><td>{reportData.odi3.avgEventDuration}</td></tr>
//             </tbody>
//           </table>
         
//           <p className='od-definition'><strong>Definition: {reportData.definitions.odi3}</strong></p>
//           <p className='od-definition'><strong>ODI 3% Event: {reportData.definitions.odi3Event}</strong></p>
   
//           </div>
//             </section>
//             <section className='odi-sections-row'>
//           <div className='odi-box'>
//           <h2>Threshold Data</h2>
//           <h3>SpO2 Threshold: 94</h3>
//           <table>
//             <thead>
//               <tr>
//                 <th></th>
//                 <th>Duration</th>
//                 <th>% Total</th>
//               </tr>
//             </thead>
//             <tbody>
//               {reportData.thresholdData.spo2.map((row, index) => (
//                 <tr key={index}>
//                   <td>{row.threshold}</td>
//                   <td>{row.duration}</td>
//                   <td>{row.total}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//             </div>
//             <div className='odi-box'>
//           <h2>Pulse Rate Threshold</h2>
//             <h3>Definition: <p style={{display:"inline"}}>{reportData.definitions.threshold},</p></h3>

//           <table>
//             <thead>
//               <tr>
//                 <th></th>
//                 <th>Duration</th>
//                 <th>% Total</th>
//               </tr>
//             </thead>
//             <tbody>
//               {reportData.thresholdData.pulseRate.map((row, index) => (
//                 <tr key={index}>
//                   <td>{row.threshold}</td>
//                   <td>{row.duration}</td>
//                   <td>{row.total}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           </div>
          
//           </section>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Summary;