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
import ECG from "./ECG/Ecg";

import './styles/App.css'
import logo from './assets/logo.png'

function Layout() {
  const location = useLocation();

  const showNavbar =
    location.pathname !== "/" &&
    location.pathname !== "/login" &&
    location.pathname !== "/userlist";

  return (
    <div className="app-wrapper">
      {showNavbar && (
        <aside className="sidebar">
        <img
            src={logo}
            alt="Logo"
            className="sidebar-logo"
          />          
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
    navigate("/userlist");
  };

  const handleUserSelected = () => {
    navigate("/summary");
  };

  return (
    <Routes>
      <Route path="/" element={<Login onLoginSuccess={handleLoginSuccess} />} />
      <Route path="userlist" element={<UserList onUserSelected={handleUserSelected} />} />
      <Route path="/" element={<Layout />}>
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
