import React, { useEffect, useState } from "react";
import axios from "axios";
import "./UserList.css";

export default function UserList({onUserSelected}) {
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [isFileUploaded,setIsFileUploaded] = useState(false);
  
  // user list handlings
  useEffect(() => {

    const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:8000/list_user_folders/",{
        withCredentials:true
      });
      console.log(res.data.folders);
      setUsers(res.data.folders);
    } catch (err) {
      console.error("Error fetching users :", err);
    }
  };

    fetchUsers();
  }, [isFileUploaded]);

  async function handleSelect(user){
    try{
      const res = await axios.post("http://localhost:8000/set_active_user/",{
        "folder_clicked":user
      },{withCredentials:true})
      if(res.status===200){
    
        onUserSelected();
    }
    }catch(err){
      console.log("ERRRR");
    }
  }
  // end of user list handlings

  //file upload handlings
    const handleChange = (e) => {
      setFiles([...e.target.files]);
    };
    const handleUpload = async () => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
        console.log(file.webkitRelativePath);
        formData.append("paths", file.webkitRelativePath);
      });

      try {
        const res = await axios.post(
          "http://localhost:8000/upload_folder/",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          }
        );
        setIsFileUploaded(!isFileUploaded);
        alert(res.data.message);
      } catch (err) {
        console.error(err);
        alert("Upload failed");
      }
    };
  //end of file upload handlings
  

  return (
    <div className="user-list-container">
      <h2>Users</h2>
      <div className="user-grid">
        {users.map((user) => (
          <div
            key={user}
            onClick={()=>handleSelect(user)}
            className="user-box"
          >
            <div className="user-name">{user}</div>
          </div>
        ))}
      </div>
        
        
        <div>
          <input
            type="file"
            webkitdirectory="true"
            directory=""
            multiple
            onChange={handleChange}
          />
          <button onClick={handleUpload}>Upload Folder</button>
      </div>
      

    </div>
  );
}
