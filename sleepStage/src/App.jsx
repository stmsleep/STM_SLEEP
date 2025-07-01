import CSVUploader from "./HeartRate/CSVUploader";
import EOGUploader from "./EOG/EOGUploader";
import Login from "./components/Login";
import DashBoard from "./components/DashBoard";
import LandingPage from "./components/LandingPage";

import JarvisTesting from "./components/jarvis_testing";

import {
  Routes,
  Route,
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
  BrowserRouter as Router,
} from "react-router-dom";
import Summary from "./summary/Summary";
import UserList from "./components/UserList";
import ECG from "./ECG/Ecg";
import EEGVisualizer from "./EEG/EEGVisualizer"

import './styles/App.css';
import logo from './assets/logo.png';


function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const showNavbar =
    location.pathname !== "/" && location.pathname !== "/login";

  const handleNav = (path) => {
    navigate(path, { replace: true });
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="app-wrapper">
      {showNavbar && (
        <aside className="sidebar">
          <img src={logo} alt="Logo" className="sidebar-logo" />
          <nav className="navbar">
            <button
              onClick={() => handleNav("/dashboard")}
              className={`nav-button ${isActive("/dashboard") ? "active" : ""}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => handleNav("/summary")}
              className={`nav-button ${isActive("/summary") ? "active" : ""}`}
            >
              Summary
            </button>
            <button
              onClick={() => handleNav("/heartrate")}
              className={`nav-button ${isActive("/heartrate") ? "active" : ""}`}
            >
              Heart Rate
            </button>
            <button
              onClick={() => handleNav("/eog")}
              className={`nav-button ${isActive("/eog") ? "active" : ""}`}
            >
              EOG Sensor
            </button>
            <button
              onClick={() => handleNav("/ecg")}
              className={`nav-button ${isActive("/ecg") ? "active" : ""}`}
            >
              ECG
            </button>
            <button 
              onClick={()=> handleNav("/eeg")}
              className={`nav-button ${isActive("/ecg") ? "active" : ""}`}
            >
              EEG
            </button>
            <button
              onClick={() => handleNav("/userlist")}
              className={`nav-button ${isActive("/userlist") ? "active" : ""}`}
            >
              Visualize
            </button>
            <button
              onClick={() => handleNav("/test")}
              className={`nav-button ${isActive("/test") ? "active" : ""}`}
            >
              test
            </button>
          </nav>
        </aside>
      )}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate("/landingpage",{replace:true});
  };

  const handleLandingPageNext = () => {
    navigate("/userlist",{replace:true});
  };

  const handleUserSelected = () => {
    navigate("/dashboard",{replace:true});
  };

  return (
    <Routes>
      <Route path="/" element={<Login onLoginSuccess={handleLoginSuccess} />} />
      <Route path="landingpage" element={<LandingPage  onNext={handleLandingPageNext}  /> } />
      <Route path="userlist" element={<UserList onUserSelected={handleUserSelected} />} />
      <Route path="/" element={<Layout />}>
        <Route path="dashboard" element={<DashBoard/>} />
        <Route path="summary" element={<Summary />} />
        <Route path="heartrate" element={<CSVUploader />} />
        <Route path="eog" element={<EOGUploader />} />
        <Route path="eeg" element={<EEGVisualizer />} />
        <Route path="ecg" element={<ECG />} />
        <Route path="test" element={<JarvisTesting />} />
      </Route>
    </Routes>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
