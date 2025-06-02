import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./UserList.css";

export default function UserList({onUserSelected}) {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:8000/display_users/");
      setUsers(res.data.users);
    } catch (err) {
      console.error("Error fetching users :", err);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);
  const onUserClick = async (username) => {
    try {
      await axios.post(
        "http://localhost:8000/set_active_user/",
        { username },
        { withCredentials: true }
      );
      onUserSelected();
      // navigate("/summary");
    } catch (err) {
      console.error("Error activating user :", err);
    }
  };
  return (
    <div className="user-list-container">
      <h2>Users</h2>
      <div className="user-grid">
        {users.map((user) => (
          <div
            key={user}
            onClick={() => onUserClick(user)}
            className="user-box"
          >
            <div className="user-name">{user}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
