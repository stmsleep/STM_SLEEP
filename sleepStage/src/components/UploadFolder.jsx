import React, { useState } from 'react';
import axios from 'axios';

export default function FolderUpload({ username }) {
  const [files, setFiles] = useState([]);

  const handleChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('username', username);
    files.forEach(file => {
      formData.append('folder[]', file);
    });

    try {
      const res = await axios.post('http://localhost:8000/upload_folder/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.data.message);
    } catch (err) {
      console.error('Upload error', err);
    }
  };

  return (
    <div>
      <input type="file" webkitdirectory="true" directory="" multiple onChange={handleChange} />
      <button onClick={handleUpload}>Upload Folder</button>
    </div>
  );
}
