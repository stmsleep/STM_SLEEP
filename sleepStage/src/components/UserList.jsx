import React, { useEffect, useState } from "react";
import axios from "axios";
import ibutton from '../assets/i.png';
import Spinner from "../spinner/Spinner";
import "../styles/UserList.css";

export default function UserList({ onUserSelected }) {
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [isSelectingUser, setIsSelectingUser] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
    setIsSelectingUser(true);
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
    const selectedFiles = [...e.target.files];
    setFiles(selectedFiles);
    if (selectedFiles.length > 0) {
      const folderName = selectedFiles[0].webkitRelativePath.split("/")[0];
      setSelectedFolder(folderName);
    }
  };

  const handleUpload = async () => {
    if (!files.length) return;

    setIsUploading(true);

    const formData = new FormData();
    files.forEach((file, idx) => {
      formData.append(`files_${idx}`, file);
      formData.append(`paths_${idx}`, file.webkitRelativePath);
    });
    formData.append("file_count", files.length);

    try {
      const res = await axios.post("http://localhost:8000/upload_folder/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      alert(res.data.message);
      setIsFileUploaded(!isFileUploaded);
      setSelectedFolder(null);
      setFiles([]);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="user-page"
      style={{
        position: "relative",
        pointerEvents: isSelectingUser || isUploading ? "none" : "auto",
        opacity: isSelectingUser || isUploading ? 0.4 : 1,
      }}
    >
      {(isSelectingUser || isUploading) && (
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
          <button onClick={handleUpload} disabled={isUploading || !files.length}>
            {isUploading ? "Uploading..." : "Upload Folder"}
          </button>
        </section>

        {selectedFolder && (
          <div style={{ marginTop: '1rem', textAlign: 'center', fontWeight: '500' }}>
            Selected Folder: <span style={{ color: 'var(--primary)' }}>{selectedFolder}</span>
          </div>
        )}
      </main>
    </div>
  );
}
