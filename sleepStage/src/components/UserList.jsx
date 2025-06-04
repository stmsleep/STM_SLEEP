import React, { useEffect, useState } from "react";
import axios from "axios";
import "./UserList.css";

export default function UserList({onUserSelected}) {
  const [users, setUsers] = useState([]);

  useEffect(() => {

    const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:8000/list_user_folders/");
      console.log(res.data.folders);
      setUsers(res.data.folders);
    } catch (err) {
      console.error("Error fetching users :", err);
    }
  };

    fetchUsers();
  }, []);

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
    </div>
  );
}
