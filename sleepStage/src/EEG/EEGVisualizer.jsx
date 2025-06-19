import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
    import ReactECharts from 'echarts-for-react';
    
    export default function EEGChart() {
      const [data, setData] = useState([]);
      const [times, setTimes] = useState([]);
      const [samplingRate, setSamplingRate] = useState(256); // default
      const [rangeStart, setRangeStart] = useState(0); // index
      const windowSize = useMemo(() => samplingRate * 60, [samplingRate]); // 1 minute window
    
      useEffect(() => {
        const fetchEEGData = async () => {
          try {
            console.log("Fetching data...")
            const res = await axios.get('http://localhost:8000/process_eeg/', {
                withCredentials:true
            }); // adjust this
            const json = await res.data;
            setData(json.data);
            setTimes(json.times);
            setSamplingRate(json.sampling_rate);
            console.log("Fetched data...")
          } catch (err) {
            console.error("Error loading EEG data:", err);
          }
        };
        fetchEEGData();
      }, []);
    
      const rangeEnd = Math.min(rangeStart + windowSize, times.length);
      const visibleTimes = times.slice(rangeStart, rangeEnd);
      const visibleData = data.slice(rangeStart, rangeEnd);
    
      const chartOptions = {
        title: {
          text: 'EEG Signal',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          formatter: function (params) {
            const point = params[0];
            return `Time: ${point.axisValue}s<br/>Value: ${point.data} µV`;
          }
        },
        xAxis: {
          type: 'category',
          data: visibleTimes,
          name: 'Time (s)',
        },
        yAxis: {
          type: 'value',
          name: 'Amplitude (µV)',
          scale: true,
        },
        series: [
          {
            data: visibleData,
            type: 'line',
            smooth: true,
            showSymbol: false,
            lineStyle: {
              width: 1.5,
            }
          }
        ],
        grid: {
          top: 50,
          bottom: 80,
          left: 60,
          right: 40
        }
      };
    
      const handleSliderChange = (e) => {
        setRangeStart(Number(e.target.value) * windowSize);
      };
    
      const totalMinutes = Math.floor(times.length / windowSize);
    
      return (
        <div>
          <ReactECharts option={chartOptions} style={{ height: '400px', width: '100%' }} />
          <div style={{ padding: '10px 20px' }}>
            <input
              type="range"
              min="0"
              max={totalMinutes - 1}
              value={Math.floor(rangeStart / windowSize)}
              onChange={handleSliderChange}
              style={{ width: '100%' }}
            />
            <div style={{ textAlign: 'center', marginTop: '5px' }}>
              Minute: {Math.floor(rangeStart / windowSize) + 1} / {totalMinutes}
            </div>
          </div>
        </div>
      );
    }
    
