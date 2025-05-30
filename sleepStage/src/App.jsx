import "./App.css";
import CSVUploader from "./HeartRate/CSVUploader";
import EOGUploader from "./EOG/EOGUploader";
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

  const showNavbar = location.pathname !== "/";

  return (
    <div className="app-wrapper">
      {showNavbar && (
        <nav className="navbar">
          <NavLink to="/summary" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Summary</NavLink>
          <NavLink to="/heartrate" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Heart Rate</NavLink>
          <NavLink to="/eog" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>EOG Sensor</NavLink>
          <NavLink to="/ecg" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>ECG</NavLink>
        </nav>
      )}
      <Outlet />
    </div>
  );
}


function App() {
  const navigate = useNavigate();

  const handleUserSelected = () => {
    navigate("/summary");
  };

  return (
    <Routes>
      <Route path="/" element={<Layout/>}>
        <Route
          index
          element={<UserList onUserSelected={handleUserSelected} />}
        />
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
