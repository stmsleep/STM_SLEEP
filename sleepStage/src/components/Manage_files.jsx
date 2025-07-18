import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FaTrash } from "react-icons/fa";
import "../styles/ManageFiles.css";

export default function ManageFiles() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  async function fetchFiles() {
    try {
      const res = await axios.get('http://localhost:8000/fetch_files/', { withCredentials: true });
      const files = Object
        .values(res.data)
        .flatMap(innerObj => Object.values(innerObj))
        .map(path => ({
          displayName: path.endsWith(".npz")?path.substring(path.lastIndexOf("/") + 1, path.lastIndexOf(".")):path.substring(path.lastIndexOf("/")+1),
          fullPath: path
        }));
      setFiles(files);
    } catch (err) {
      console.error("Failed to fetch files", err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteFile(fullPath) {
    try {
      setLoading(true);
      await axios.delete(`http://localhost:8000/delete_file/`, {
        data: { path: fullPath },
        withCredentials: true
      });
      setFiles(prevFiles => prevFiles.filter(f => f.fullPath !== fullPath));
    } catch (err) {
      console.error("Failed to delete file:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e) {
    const selected = e.target.files[0];
    setSelectedFile(selected);
  }

  async function handleFileSubmit() {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile);
    setUploading(true);
    try {
      const res = await axios.post("http://localhost:8000/upload_file/", formData, { withCredentials: true });
      alert(res.data.message || "File uploaded successfully");
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";  // 🔥 reset file input
      fetchFiles();
    } catch (err) {
      console.log(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="file-list-container">
      <h2 className="file-list-title">Available Files</h2>
      {loading ? (
        <div className="loader">Loading files...</div>
      ) : (
        <div className="file-list">
          {files.length === 0 ? (
            <div className="no-files">No files found. Upload to get started!</div>
          ) : (
            files.map((file, index) => file.displayName.length >0 ?(
              <div className="file-list-item" key={index}>
                <div className="file-name">{file.displayName}</div>
                <button
                  className="delete-btn"
                  onClick={() => deleteFile(file.fullPath)}
                  disabled={loading}
                >
                  <FaTrash />
                </button>
              </div>
            ):null)
          )}
        </div>
      )}

      <div className="upload-section">
        <input
          type="file"
          onChange={handleFileChange}
          ref={inputRef}
        />
        <button
          className="upload-btn"
          onClick={handleFileSubmit}
          disabled={!selectedFile || uploading}
        >
          {uploading ? "Uploading..." : "Upload file"}
        </button>
      </div>
    </div>
  );
}
