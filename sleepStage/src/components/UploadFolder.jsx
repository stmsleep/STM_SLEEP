import React, { useState } from 'react';
import axios from 'axios';

export default function UploadFolder() {
  const [files, setFiles] = useState([]);

  const handleFolderSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file, file.webkitRelativePath);
    });

    try {
      await axios.post('http://127.0.0.1:8000/upload_folder/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },  
        withCredentials:true
      });
      alert('Folder uploaded to Dropbox successfully!');
    } catch (error) {
      console.error(error);
      alert('Upload failed.');
    }
  };

  return (
    <div>
      <input type="file" webkitdirectory="true" multiple onChange={handleFolderSelect} />
      <button onClick={handleUpload}>Upload to Dropbox</button>
    </div>
  );
}
