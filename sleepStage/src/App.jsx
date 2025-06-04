import React from "react";
import "./App.css";
import CSVUploader from "./HeartRate/CSVUploader";
import EOGUploader from "./EOG/EOGUploader";
import Login from "./components/Login";
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
import ECG from "./Ecg";

function Layout() {
  const location = useLocation();

  const showNavbar = location.pathname !== "/" && location.pathname !== "/login";

  return (
    <div className="app-wrapper">
      {showNavbar && (
        <nav className="navbar">
          <NavLink
            to="/summary"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            Summary
          </NavLink>
          <NavLink
            to="/heartrate"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            Heart Rate
          </NavLink>
          <NavLink
            to="/eog"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            EOG Sensor
          </NavLink>
          <NavLink
            to="/ecg"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            ECG
          </NavLink>
        </nav>
      )}
      <Outlet />
    </div>
  );
}

function App() {
  const navigate = useNavigate();

  // Called when user logs in successfully
  const handleLoginSuccess = () => {
    navigate("/userlist");
  };

  const handleUserSelected = () => {
    navigate("/summary");
  };

  return (
    <Routes>
      {/* Login page at root */}
      <Route path="/" element={<Login onLoginSuccess={handleLoginSuccess} />} />
      {/* Protected routes inside layout */}
      <Route path="/" element={<Layout />}>
        <Route path="userlist" element={<UserList onUserSelected={handleUserSelected} />} />
        <Route path="summary" element={<Summary />} />
        <Route path="heartrate" element={<CSVUploader />} />
        <Route path="eog" element={<EOGUploader />} />
        <Route path="ecg" element={<ECG />} />
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
