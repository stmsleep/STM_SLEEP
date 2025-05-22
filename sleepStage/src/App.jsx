import './App.css';
import CSVUploader from './HeartRate/CSVUploader';
import EOGUploader from './EOG/EOGUploader';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Summary from './summary/Summary';

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <nav className="navbar">
          <NavLink
            to="/"
            end
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Summary
          </NavLink>
          <NavLink
            to="/heartrate"
            end
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Heart Rate
          </NavLink>
          <NavLink
            to="/eog"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            EOG Sensor
          </NavLink>
        </nav>

        <Routes>
          <Route path="/" element={<Summary/>} />
          <Route path="/heartrate" element={<CSVUploader />} />
          <Route path="/eog" element={<EOGUploader />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
