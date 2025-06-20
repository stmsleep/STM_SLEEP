// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";
// import EEGChannelPlot from "./EEGMainPlot";

// export default function EEGChart() {
//   const [channel, setChannel] = useState("");
//   const [channelList, setChannelList] = useState([]);
//   const [selectedChannel, setSelectedChannel] = useState(null);
//   const [eegData, setEegData] = useState(null);
//   const sf = 0;
//   const [samplingRate, setSamplingRate] = useState(256);
//   const windowSize = useMemo(() => samplingRate * 60, [samplingRate]);
//   const [rangeStart, setRangeStart] = useState(0);

//   // ✅ Fetch EEG data only when a channel is selected
//   useEffect(() => {
//     if (!selectedChannel) return;

//     const fetchEEGData = async () => {
//       try {
//         console.log("Fetching EEG for:", selectedChannel);
//         const res = await axios.get(
//           `http://localhost:8000/process_eeg/${selectedChannel}/`,
//           { withCredentials: true }
//         );
//         setEegData({
//           signal: res.data.signal,
//           times: res.data.times,
//           channelName: res.data.channel,
//         });
//         setSamplingRate(256); // or from backend if needed
//         setRangeStart(0);
//       } catch (err) {
//         console.error("Error fetching EEG data:", err);
//       }
//     };

//     fetchEEGData();
//   }, [selectedChannel]);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (channel.trim() !== "" && !channelList.includes(channel)) {
//       setChannelList([channel, ...channelList]);
//       setChannel("");
//     }
//   };

//   const handleSliderChange = (e) => {
//     setRangeStart(Number(e.target.value) * windowSize);
//   };

//   const totalMinutes = eegData
//     ? Math.floor(eegData.times.length / windowSize)
//     : 0;

//   const rangeEnd = eegData
//     ? Math.min(rangeStart + windowSize, eegData.times.length)
//     : 0;
//   const visibleTimes = eegData ? eegData.times.slice(rangeStart, rangeEnd) : [];
//   const visibleSignal = eegData
//     ? eegData.signal.slice(rangeStart, rangeEnd)
//     : [];
//   console.log("Start:", rangeStart, "End:", rangeEnd);
//   console.log(
//     "Times:",
//     visibleTimes[0],
//     "→",
//     visibleTimes[visibleTimes.length - 1]
//   );

//   return (
//     <div style={{ padding: "20px" }}>
//       {/* EEG Plot for selected channel */}
//       {eegData && (
//         <div style={{ marginBottom: "20px" }}>
//           <EEGChannelPlot
//             channelName={eegData.channelName}
//             data={{ [eegData.channelName]: visibleSignal }}
//             times={visibleTimes}
//           />
//           <div style={{ padding: "10px 20px" }}>
//             <input
//               type="range"
//               min="0"
//               max={totalMinutes - 1}
//               value={Math.floor(rangeStart / windowSize)}
//               onChange={handleSliderChange}
//               style={{ width: "100%" }}
//             />
//             <div style={{ textAlign: "center", marginTop: "5px" }}>
//               Minute: {Math.floor(rangeStart / windowSize) + 1} / {totalMinutes}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Channel Buttons */}
//       <div
//         style={{
//           marginBottom: "20px",
//           display: "flex",
//           gap: "10px",
//           flexWrap: "wrap",
//         }}
//       >
//         {channelList.map((ch, idx) => (
//           <div
//             key={idx}
//             onClick={() => setSelectedChannel(ch)}
//             style={{
//               padding: "10px 20px",
//               backgroundColor: selectedChannel === ch ? "#0056b3" : "#cce5ff",
//               color: selectedChannel === ch ? "#fff" : "#004085",
//               borderRadius: "10px",
//               cursor: "pointer",
//             }}
//           >
//             {ch}
//           </div>
//         ))}
//       </div>

//       {/* Channel Form */}
//       <form
//         onSubmit={handleSubmit}
//         style={{
//           display: "flex",
//           flexDirection: "column",
//           justifyContent: "center",
//           alignItems: "center",
//           gap: "20px",
//           height: "50vh",
//           width: "100%",
//         }}
//       >
//         <input
//           style={{
//             borderRadius: "10px",
//             height: "50px",
//             borderColor: "blue",
//             padding: "10px",
//           }}
//           type="text"
//           placeholder="Channel Name"
//           name="channel"
//           value={channel}
//           onChange={(e) => setChannel(e.target.value)}
//         />
//         <input
//           type="number"
//           placeholder="Sampling Frequency"
//           name="sf"
//           value={samplingRate}
//           onChange={(e) => setSamplingRate(Number(e.target.value))}
//         />
//         <button type="submit">Submit</button>
//       </form>
//     </div>
//   );
// }
// // import React, { useState, useEffect, useMemo } from "react";
// // import axios from "axios";
// // import EEGChannelPlot from "./EEGMainPlot";
// // import ReactECharts from "echarts-for-react";

// // export default function EEGChart() {
// //   const [channel, setChannel] = useState("");
// //   const [channelList, setChannelList] = useState([]);
// //   const [selectedChannel, setSelectedChannel] = useState(null);
// //   const [eegData, setEegData] = useState(null);
// //   const [samplingRate, setSamplingRate] = useState(256);
// //   const [rangeStart, setRangeStart] = useState(0);

// //   const windowSize = useMemo(() => samplingRate * 60, [samplingRate]);

// //   // Fetch EEG + bands when a channel is selected
// //   useEffect(() => {
// //     if (!selectedChannel) return;

// //     const fetchEEGData = async () => {
// //       try {
// //         const res = await axios.get(
// //           `http://localhost:8000/process_eeg/${selectedChannel}/`,
// //           { withCredentials: true }
// //         );
// //         setEegData({
// //           signal: res.data.signal,
// //           times: res.data.times,
// //           channelName: res.data.channel,
// //           bands: res.data.bands,
// //         });
// //         setSamplingRate(res.data.sampling_rate || 256);
// //         setRangeStart(0);
// //       } catch (err) {
// //         console.error("Error fetching EEG data:", err);
// //       }
// //     };

// //     fetchEEGData();
// //   }, [selectedChannel]);

// //   const handleSubmit = (e) => {
// //     e.preventDefault();
// //     if (channel.trim() !== "" && !channelList.includes(channel)) {
// //       setChannelList([channel, ...channelList]);
// //       setChannel("");
// //     }
// //   };

// //   const handleSliderChange = (e) => {
// //     setRangeStart(Number(e.target.value) * windowSize);
// //   };

// //   const totalMinutes = eegData
// //     ? Math.floor(eegData .times.length / windowSize)
// //     : 0;
// //   const rangeEnd = eegData
// //     ? Math.min(rangeStart + windowSize, eegData.times.length)
// //     : 0;

// //   const visibleTimes = eegData ? eegData.times.slice(rangeStart, rangeEnd) : [];
// //   const visibleSignal = eegData
// //     ? eegData.signal.slice(rangeStart, rangeEnd)
// //     : [];

// //   return (
// //     <div style={{ padding: "20px" }}>
// //       {/* Raw EEG Signal */}
// //       {eegData && (
// //         <div style={{ marginBottom: "20px" }}>
// //           <EEGChannelPlot
// //             channelName={`Raw - ${eegData.channelName}`}
// //             data={{ [eegData.channelName]: visibleSignal }}
// //             times={visibleTimes}
// //           />
// //           <div style={{ padding: "10px 20px" }}>
// //             <input
// //               type="range"
// //               min="0"
// //               max={totalMinutes - 1}
// //               value={Math.floor(rangeStart / windowSize)}
// //               onChange={handleSliderChange}
// //               style={{ width: "100%" }}
// //             />
// //             <div style={{ textAlign: "center", marginTop: "5px" }}>
// //               Minute: {Math.floor(rangeStart / windowSize) + 1} / {totalMinutes}
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* Frequency Band Plots */}
// //       {eegData?.bands && (
// //         <div style={{ marginTop: "40px" }}>
// //           <h3 style={{ marginBottom: "15px" }}>
// //             Frequency Band Visualizations
// //           </h3>
// //           {Object.entries(eegData.bands).map(([band, bandSignal]) => {
// //             const visibleBandSignal = bandSignal.slice(rangeStart, rangeEnd);
// //             return (
// //               <ReactECharts
// //                 key={band}
// //                 option={{
// //                   title: { text: `${band.toUpperCase()} Band` },
// //                   xAxis: { type: "value", name: "Time (s)" },
// //                   yAxis: { type: "value", name: "Amplitude (µV)" },
// //                   tooltip: { trigger: "axis" },
// //                   series: [
// //                     {
// //                       data: visibleTimes.map((t, i) => [
// //                         t,
// //                         visibleBandSignal[i],
// //                       ]),
// //                       type: "line",
// //                       showSymbol: false,
// //                       name: band,
// //                       lineStyle: { width: 1 },
// //                     },
// //                   ],
// //                 }}
// //                 style={{ height: 300, marginBottom: 40 }}
// //               />
// //             );
// //           })}
// //         </div>
// //       )}

// //       {/* Channel Select Buttons */}
// //       <div
// //         style={{
// //           marginBottom: "20px",
// //           display: "flex",
// //           gap: "10px",
// //           flexWrap: "wrap",
// //         }}
// //       >
// //         {channelList.map((ch, idx) => (
// //           <div
// //             key={idx}
// //             onClick={() => setSelectedChannel(ch)}
// //             style={{
// //               padding: "10px 20px",
// //               backgroundColor: selectedChannel === ch ? "#0056b3" : "#cce5ff",
// //               color: selectedChannel === ch ? "#fff" : "#004085",
// //               borderRadius: "10px",
// //               cursor: "pointer",
// //             }}
// //           >
// //             {ch}
// //           </div>
// //         ))}
// //       </div>

// //       {/* Channel Input Form */}
// //       <form
// //         onSubmit={handleSubmit}
// //         style={{
// //           display: "flex",
// //           flexDirection: "column",
// //           justifyContent: "center",
// //           alignItems: "center",
// //           gap: "20px",
// //           height: "50vh",
// //           width: "100%",
// //         }}
// //       >
// //         <input
// //           style={{
// //             borderRadius: "10px",
// //             height: "50px",
// //             borderColor: "blue",
// //             padding: "10px",
// //           }}
// //           type="text"
// //           placeholder="Channel Name"
// //           value={channel}
// //           onChange={(e) => setChannel(e.target.value)}
// //         />
// //         <input
// //           type="number"
// //           placeholder="Sampling Frequency"
// //           value={samplingRate}
// //           onChange={(e) => setSamplingRate(Number(e.target.value))}
// //         />
// //         <button type="submit">Submit</button>
// //       </form>
// //     </div>
// //   );
// // }
// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";
// import ReactECharts from "echarts-for-react";
// import EEGChannelPlot from "./EEGMainPlot";

// export default function EEGChart() {
//   const [channel, setChannel] = useState("");
//   const [channelList, setChannelList] = useState([]);
//   const [selectedChannel, setSelectedChannel] = useState(null);
//   const [eegData, setEegData] = useState(null);
//   const [samplingRate, setSamplingRate] = useState(256);
//   const windowSize = useMemo(() => samplingRate * 60, [samplingRate]);
//   const [rangeStart, setRangeStart] = useState(0);

//   // Fetch EEG data when a channel is selected
//   useEffect(() => {
//     if (!selectedChannel) return;

//     const fetchEEGData = async () => {
//       try {
//         console.log("Fetching EEG for:", selectedChannel);
//         const res = await axios.get(
//           `http://localhost:8000/process_eeg/${selectedChannel}/`,
//           { withCredentials: true, responseType: "text" }
//         );
//         const data = JSON.parse(res.data);
//         console.log("Parsed EEG data:", data);
//         console.log("Fetched EEG data:", res.data);

//         setEegData({
//           signal: data.signal,
//           times: data.times,
//           channelName: data.channel,
//           bands: data.bands || {},
//         });

//         setSamplingRate(data.sampling_rate || 256);
//         setRangeStart(0);
//       } catch (err) {
//         console.error("Error fetching EEG data:", err);
//       }
//     };

//     fetchEEGData();
//   }, [selectedChannel]);

//   // Automatically select the first channel if available
//   useEffect(() => {
//     if (channelList.length > 0 && !selectedChannel) {
//       setSelectedChannel(channelList[0]);
//     }
//   }, [channelList]);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (channel.trim() !== "" && !channelList.includes(channel)) {
//       setChannelList([channel, ...channelList]);
//       setChannel("");
//     }
//   };

//   const handleSliderChange = (e) => {
//     setRangeStart(Number(e.target.value) * windowSize);
//   };

//   const totalMinutes = eegData?.times?.length
//     ? Math.floor(eegData.times.length / windowSize)
//     : 0;

//   const rangeEnd =
//     eegData?.times?.length > 0
//       ? Math.min(rangeStart + windowSize, eegData.times.length)
//       : 0;

//   const visibleTimes =
//     eegData?.times?.length > 0 ? eegData.times.slice(rangeStart, rangeEnd) : [];

//   const visibleSignal =
//     eegData?.signal?.length > 0
//       ? eegData.signal.slice(rangeStart, rangeEnd)
//       : [];

//   return (
//     <div style={{ padding: "20px" }}>
//       {/* Raw EEG Plot */}
//       {eegData && eegData.times && eegData.signal && (
//         <div style={{ marginBottom: "20px" }}>
//           <h2 style={{ marginBottom: "10px" }}>Raw EEG Signal</h2>
//           <EEGChannelPlot
//             channelName={eegData.channelName}
//             data={{ [eegData.channelName]: visibleSignal }}
//             times={visibleTimes}
//           />
//           <div style={{ padding: "10px 20px" }}>
//             <input
//               type="range"
//               min="0"
//               max={totalMinutes - 1}
//               value={Math.floor(rangeStart / windowSize)}
//               onChange={handleSliderChange}
//               style={{ width: "100%" }}
//             />
//             <div style={{ textAlign: "center", marginTop: "5px" }}>
//               Minute: {Math.floor(rangeStart / windowSize) + 1} / {totalMinutes}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Frequency Band Plots */}
//       {eegData?.bands && (
//         <div style={{ marginTop: "40px", display: "flex" }}>
//           <h3 style={{ marginBottom: "15px" }}>
//             Frequency Band Visualizations
//           </h3>
//           {Object.entries(eegData.bands).map(([band, bandSignal]) => {
//             const visibleBandSignal = bandSignal.slice(rangeStart, rangeEnd);
//             return (
//               <ReactECharts
//                 key={band}
//                 option={{
//                   title: { text: `${band.toUpperCase()} Band` },
//                   xAxis: { type: "value", name: "Time (s)" },
//                   yAxis: { type: "value", name: "Amplitude (µV)" },
//                   tooltip: { trigger: "axis" },
//                   series: [
//                     {
//                       data: visibleTimes.map((t, i) => [
//                         t,
//                         visibleBandSignal[i],
//                       ]),
//                       type: "line",
//                       showSymbol: false,
//                       name: band,
//                       lineStyle: { width: 1 },
//                     },
//                   ],
//                 }}
//                 notMerge={true}
//                 lazyUpdate={true}
//                 style={{ height: 300, marginBottom: 40 }}
//               />
//             );
//           })}
//         </div>
//       )}

//       {/* Channel Buttons */}
//       <div
//         style={{
//           marginBottom: "20px",
//           display: "flex",
//           gap: "10px",
//           flexWrap: "wrap",
//         }}
//       >
//         {channelList.map((ch, idx) => (
//           <div
//             key={idx}
//             onClick={() => setSelectedChannel(ch)}
//             style={{
//               padding: "10px 20px",
//               backgroundColor: selectedChannel === ch ? "#0056b3" : "#cce5ff",
//               color: selectedChannel === ch ? "#fff" : "#004085",
//               borderRadius: "10px",
//               cursor: "pointer",
//             }}
//           >
//             {ch}
//           </div>
//         ))}
//       </div>

//       {/* Channel Form */}
//       <form
//         onSubmit={handleSubmit}
//         style={{
//           display: "flex",
//           flexDirection: "column",
//           justifyContent: "center",
//           alignItems: "center",
//           gap: "20px",
//           height: "50vh",
//           width: "100%",
//         }}
//       >
//         <input
//           style={{
//             borderRadius: "10px",
//             height: "50px",
//             borderColor: "blue",
//             padding: "10px",
//           }}
//           type="text"
//           placeholder="Channel Name"
//           name="channel"
//           value={channel}
//           onChange={(e) => setChannel(e.target.value)}
//         />
//         <input
//           type="number"
//           placeholder="Sampling Frequency"
//           name="sf"
//           value={samplingRate}
//           onChange={(e) => setSamplingRate(Number(e.target.value))}
//         />
//         <button type="submit">Submit</button>
//       </form>
//     </div>
//   );
// }

// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";
// import EEGChannelPlot from "./EEGMainPlot";

// export default function EEGChart() {
//   const [channel, setChannel] = useState("");
//   const [channelList, setChannelList] = useState([]);
//   const [selectedChannel, setSelectedChannel] = useState(null);
//   const [eegData, setEegData] = useState(null);
//   const [samplingRate, setSamplingRate] = useState(256);
//   const windowSize = useMemo(() => samplingRate * 60, [samplingRate]);
//   const [rangeStart, setRangeStart] = useState(0);

//   useEffect(() => {
//     if (!selectedChannel) return;

//     const fetchEEGData = async () => {
//       try {
//         const res = await axios.get(
//           `http://localhost:8000/process_eeg/${selectedChannel}/`,
//           { withCredentials: true }
//         );

//         if (!res.data.signal || !res.data.times) {
//           console.error("Missing signal or times");
//           return;
//         }
//         console.log("FETCHED DATA FOR :", selectedChannel);
//         console.log("IMAGE LINK :", res.bandsImage);
//         setEegData({
//           signal: res.data.signal,
//           times: res.data.times,
//           channelName: res.data.channel,
//           bandsImage: res.data.bands_image,
//         });

//         setSamplingRate(res.data.sampling_rate || 256);
//         setRangeStart(0);
//       } catch (err) {
//         console.error("Error fetching EEG data:", err);
//       }
//     };

//     fetchEEGData();
//   }, [selectedChannel]);

//   useEffect(() => {
//     if (channelList.length > 0 && !selectedChannel) {
//       setSelectedChannel(channelList[0]);
//     }
//   }, [channelList]);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (channel.trim() !== "" && !channelList.includes(channel)) {
//       setChannelList([channel, ...channelList]);
//       setChannel("");
//     }
//   };

//   const handleSliderChange = (e) => {
//     setRangeStart(Number(e.target.value) * windowSize);
//   };

//   const totalMinutes = eegData?.times?.length
//     ? Math.floor(eegData.times.length / windowSize)
//     : 0;

//   const rangeEnd =
//     eegData?.times?.length > 0
//       ? Math.min(rangeStart + windowSize, eegData.times.length)
//       : 0;

//   const visibleTimes =
//     eegData?.times?.length > 0 ? eegData.times.slice(rangeStart, rangeEnd) : [];

//   const visibleSignal =
//     eegData?.signal?.length > 0
//       ? eegData.signal.slice(rangeStart, rangeEnd)
//       : [];

//   return (
//     <div style={{ padding: "20px" }}>
//       {/* Raw EEG Signal */}
//       {eegData && eegData.times && eegData.signal && (
//         <div style={{ marginBottom: "20px" }}>
//           <h2 style={{ marginBottom: "10px" }}>Raw EEG Signal</h2>
//           <EEGChannelPlot
//             channelName={eegData.channelName}
//             data={{ [eegData.channelName]: visibleSignal }}
//             times={visibleTimes}
//           />
//           <div style={{ padding: "10px 20px" }}>
//             <input
//               type="range"
//               min="0"
//               max={totalMinutes - 1}
//               value={Math.floor(rangeStart / windowSize)}
//               onChange={handleSliderChange}
//               style={{ width: "100%" }}
//             />
//             <div style={{ textAlign: "center", marginTop: "5px" }}>
//               Minute: {Math.floor(rangeStart / windowSize) + 1} / {totalMinutes}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Frequency Band Image */}
//       {eegData?.bandsImage.replace("?dl=0", "?raw=1") && (
//         <div style={{ marginTop: "40px" }}>
//           <h3>Frequency Band Visualizations</h3>
//           <img
//             src={eegData.bandsImage.replace("?dl=0", "?raw=1")}
//             alt="Frequency Bands"
//             style={{ width: "100%", maxWidth: "1000px", borderRadius: "10px" }}
//           />
//         </div>
//       )}

//       {/* Channel Buttons */}
//       <div
//         style={{
//           marginBottom: "20px",
//           display: "flex",
//           gap: "10px",
//           flexWrap: "wrap",
//         }}
//       >
//         {channelList.map((ch, idx) => (
//           <div
//             key={idx}
//             onClick={() => setSelectedChannel(ch)}
//             style={{
//               padding: "10px 20px",
//               backgroundColor: selectedChannel === ch ? "#0056b3" : "#cce5ff",
//               color: selectedChannel === ch ? "#fff" : "#004085",
//               borderRadius: "10px",
//               cursor: "pointer",
//             }}
//           >
//             {ch}
//           </div>
//         ))}
//       </div>

//       {/* Channel Input */}
//       <form
//         onSubmit={handleSubmit}
//         style={{
//           display: "flex",
//           flexDirection: "column",
//           justifyContent: "center",
//           alignItems: "center",
//           gap: "20px",
//           height: "50vh",
//           width: "100%",
//         }}
//       >
//         <input
//           style={{
//             borderRadius: "10px",
//             height: "50px",
//             borderColor: "blue",
//             padding: "10px",
//           }}
//           type="text"
//           placeholder="Channel Name"
//           value={channel}
//           onChange={(e) => setChannel(e.target.value)}
//         />
//         <input
//           type="number"
//           placeholder="Sampling Frequency"
//           value={samplingRate}
//           onChange={(e) => setSamplingRate(Number(e.target.value))}
//         />
//         <button type="submit">Submit</button>
//       </form>
//     </div>
//   );
// }
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import EEGChannelPlot from "./EEGMainPlot";

export default function EEGChart() {
  const [channel, setChannel] = useState("");
  const [channelList, setChannelList] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [eegData, setEegData] = useState(null);
  const [samplingRate, setSamplingRate] = useState(256);
  const windowSize = useMemo(() => samplingRate * 60, [samplingRate]);
  const [rangeStart, setRangeStart] = useState(0);

  useEffect(() => {
    if (!selectedChannel) return;
    console.log("Fetching EEG for:", selectedChannel);
    const fetchEEGData = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/process_eeg/${selectedChannel}/`,
          { withCredentials: true }
        );
        console.log("Fetched data:", res.data);
        setEegData(res.data);
        setSamplingRate(res.data.sampling_rate || 256);
        setRangeStart(0);
      } catch (err) {
        console.error("Error fetching EEG data:", err);
      }
    };

    fetchEEGData();
  }, [selectedChannel]);

  useEffect(() => {
    if (eegData?.band_plot_url) {
      console.log("IMAGE LINK:", eegData.band_plot_url);
    }
  }, [eegData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (channel.trim() !== "" && !channelList.includes(channel)) {
      setChannelList([channel, ...channelList]);
      setChannel("");
    }
  };

  const handleSliderChange = (e) => {
    setRangeStart(Number(e.target.value) * windowSize);
  };

  const totalMinutes = eegData?.times?.length
    ? Math.floor(eegData.times.length / windowSize)
    : 0;

  const rangeEnd =
    eegData?.times?.length > 0
      ? Math.min(rangeStart + windowSize, eegData.times.length)
      : 0;

  const visibleTimes =
    eegData?.times?.length > 0 ? eegData.times.slice(rangeStart, rangeEnd) : [];

  const visibleSignal =
    eegData?.signal?.length > 0
      ? eegData.signal.slice(rangeStart, rangeEnd)
      : [];

  return (
    <div style={{ padding: "20px" }}>
      {/* EEG Plot for selected channel */}
      {eegData && eegData.times && eegData.signal && (
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ marginBottom: "10px" }}>Raw EEG Signal</h2>
          <EEGChannelPlot
            channelName={eegData.channel}
            data={{ [eegData.channel]: visibleSignal }}
            times={visibleTimes}
          />

          <div style={{ padding: "10px 20px" }}>
            <input
              type="range"
              min="0"
              max={totalMinutes - 1}
              value={Math.floor(rangeStart / windowSize)}
              onChange={handleSliderChange}
              style={{ width: "100%" }}
            />
            <div style={{ textAlign: "center", marginTop: "5px" }}>
              Minute: {Math.floor(rangeStart / windowSize) + 1} / {totalMinutes}
            </div>
          </div>
        </div>
      )}

      {/* Band Plot Image (from Dropbox) */}
      {eegData?.band_plot_url && (
        <div style={{ marginTop: "30px", textAlign: "center" }}>
          <h3>Frequency Band Visualization</h3>
          <img
            src={eegData.band_plot_url}
            alt="Frequency Band"
            style={{
              width: "80%",
              maxWidth: "800px",
              borderRadius: "10px",
              marginTop: "10px",
            }}
          />
        </div>
      )}

      {/* Channel Buttons */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        {channelList.map((ch, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedChannel(ch)}
            style={{
              padding: "10px 20px",
              backgroundColor: selectedChannel === ch ? "#0056b3" : "#cce5ff",
              color: selectedChannel === ch ? "#fff" : "#004085",
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            {ch}
          </div>
        ))}
      </div>

      {/* Channel Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "20px",
          height: "50vh",
          width: "100%",
        }}
      >
        <input
          style={{
            borderRadius: "10px",
            height: "50px",
            borderColor: "blue",
            padding: "10px",
            width: "300px",
          }}
          type="text"
          placeholder="Channel Name"
          name="channel"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
        />
        <input
          type="number"
          placeholder="Sampling Frequency"
          name="sf"
          value={samplingRate}
          onChange={(e) => setSamplingRate(Number(e.target.value))}
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
