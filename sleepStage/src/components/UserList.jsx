import React, { useEffect, useState } from "react";
import axios from "axios";
import ibutton from '../assets/i.png';
import Spinner from "../spinner/Spinner";
import "../styles/UserList.css";

export default function UserList({ onUserSelected }) {
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [isSelectingUser, setIsSelectingUser] = useState(false);  // <-- loading state

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:8000/list_user_folders/", {
          withCredentials: true,
        });
        setUsers(res.data.folders);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, [isFileUploaded]);

  const handleSelect = async (user) => {
    setIsSelectingUser(true);  // show spinner + block UI
    try {
      const res = await axios.post(
        "http://localhost:8000/set_active_user/",
        { folder_clicked: user },
        { withCredentials: true }
      );
      if (res.status === 200) {
        onUserSelected();
      }
    } catch (err) {
      console.log("Error selecting user:", err);
    } finally {
      setIsSelectingUser(false);
    }
  };

  const handleChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    files.forEach((file, idx) => {
      formData.append(`files_${idx}`, file);  // unique key for each file
      formData.append(`paths_${idx}`, file.webkitRelativePath);
    });
    formData.append("file_count", files.length);
    

    try {
      const res = await axios.post("http://localhost:8000/upload_folder/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      setIsFileUploaded(!isFileUploaded);
      alert(res.data.message);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  return (
    <div className="user-page" style={{ position: "relative", pointerEvents: isSelectingUser ? "none" : "auto", opacity: isSelectingUser ? 0.4 : 1 }}>
      {isSelectingUser && (
        <div className="spinner-overlay">
          <Spinner />
        </div>
      )}

      <header className="user-header">
        <h1>Select the report</h1>
        <div className="info-container">
          <img src={ibutton} style={{ width: '24px', height: '24px' }} alt="info" />
          <span className="tooltip-text">Select a user folder or upload a new one</span>
        </div>
      </header>

      <main className="user-main">
        <section className="user-grid">
          {users.map((user) => (
            <div key={user} onClick={() => handleSelect(user)} className="user-card">
              <span>{user.length > 7 ? `${user.slice(0, 7)}...` : user}</span>
            </div>
          ))}
        </section>

        <section className="upload-section">
          <label htmlFor="folder-upload" className="custom-file-label">
            Choose Folder
            <input
              type="file"
              id="folder-upload"
              webkitdirectory="true"
              directory=""
              multiple
              onChange={handleChange}
            />
          </label>
          <button onClick={handleUpload}>Upload Folder</button>
        </section>
      </main>
    </div>
  );
}
