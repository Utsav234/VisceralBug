import React, { useEffect, useState } from "react";
import axios from "../services/api";
import '../Styles/ViewDevelopers.css';

const ViewDevelopers = () => {
  const [developers, setDevelopers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success', 'error', 'warning'
  const [assigning, setAssigning] = useState(null);
  const [removing, setRemoving] = useState(null);

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  useEffect(() => {
    const fetchDevelopers = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get("/auth/users?role=DEVELOPER", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDevelopers(response.data);
      } catch (error) {
        console.error("Failed to fetch developers", error);
        showMessage("❌ Failed to load developers. Please refresh the page.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchDevelopers();
  }, []);

  const filteredDevelopers = developers.filter((dev) =>
    dev.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssignProject = async (userId, role, username) => {
    const projectId = prompt(`Enter Project ID to assign to ${username}:`);
    if (!projectId) return;

    if (!projectId.trim()) {
      showMessage("❌ Project ID cannot be empty.", "error");
      return;
    }

    setAssigning(userId);
    const token = localStorage.getItem("token");

    try {
      await axios.put(`/projects/${projectId}/assign`, null, {
        params: { userId, role },
        headers: { Authorization: `Bearer ${token}` },
      });
      showMessage(`✅ Project ${projectId} assigned successfully to ${username}!`, "success");
    } catch (err) {
      console.error(err);
      if (err.response) {
        const errorMessage = err.response.data;
        if (errorMessage.includes("not found")) {
          showMessage(`❌ Project with ID ${projectId} not found.`, "error");
        } else if (errorMessage.includes("already assigned")) {
          showMessage(`❌ User is already assigned to this project.`, "error");
        } else {
          showMessage(`❌ Failed to assign project: ${errorMessage}`, "error");
        }
      } else if (err.request) {
        showMessage("❌ Network error. Please check your connection.", "error");
      } else {
        showMessage("❌ An unexpected error occurred.", "error");
      }
    } finally {
      setAssigning(null);
    }
  };

  const handleRemove = async (userId, role, username) => {
    const projectId = prompt(`Enter Project ID to remove ${username} from:`);
    if (!projectId) return;

    if (!projectId.trim()) {
      showMessage("❌ Project ID cannot be empty.", "error");
      return;
    }

    const confirmRemove = window.confirm(
      `Are you sure you want to remove ${username} from project ${projectId}?`
    );
    
    if (!confirmRemove) return;

    setRemoving(userId);
    const token = localStorage.getItem("token");
    try {
      await axios.put(`/projects/${projectId}/unassign`, null, {
        headers: { Authorization: `Bearer ${token}` },
        params: { userId, role },
      });
      showMessage(`✅ ${username} removed successfully from project ${projectId}!`, "success");
    } catch (err) {
      console.error("Error unassigning user:", err);
      if (err.response) {
        const errorMessage = err.response.data;
        if (errorMessage.includes("not found")) {
          showMessage(`❌ Project with ID ${projectId} not found.`, "error");
        } else if (errorMessage.includes("not assigned")) {
          showMessage(`❌ User is not assigned to this project.`, "error");
        } else {
          showMessage(`❌ Failed to remove user: ${errorMessage}`, "error");
        }
      } else if (err.request) {
        showMessage("❌ Network error. Please check your connection.", "error");
      } else {
        showMessage("❌ An unexpected error occurred.", "error");
      }
    } finally {
      setRemoving(null);
    }
  };

  const getMessageStyle = () => {
    switch (messageType) {
      case 'success':
        return { background: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' };
      case 'error':
        return { background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' };
      case 'warning':
        return { background: '#fff3cd', color: '#856404', border: '1px solid #ffeaa7' };
      default:
        return {};
    }
  };

  if (loading) {
    return (
      <div className="view-developers-container">
        <h2 className="view-developers-title">View Developers</h2>
        <div className="loading-message">Loading developers...</div>
      </div>
    );
  }

  return (
    <div className="view-developers-container">
      <h2 className="view-developers-title">View Developers</h2>
      
      {message && (
        <div className="message-box" style={getMessageStyle()}>
          {message}
        </div>
      )}
      
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      
      <div className="developers-table-container">
        {filteredDevelopers.length === 0 ? (
          <div className="no-data-message">
            {search ? "No developers found matching your search." : "No developers available."}
          </div>
        ) : (
          <table className="developers-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevelopers.map((dev) => (
                <tr key={dev.id}>
                  <td>{dev.id}</td>
                  <td>{dev.username}</td>
                  <td className="action-buttons">
                    <button 
                      className={`assign-button ${assigning === dev.id ? 'loading' : ''}`}
                      onClick={() => handleAssignProject(dev.id, "DEVELOPER", dev.username)}
                      disabled={assigning === dev.id || removing === dev.id}
                    >
                      {assigning === dev.id ? 'Assigning...' : 'Assign Project'}
                    </button>
                    <button 
                      className={`remove-button ${removing === dev.id ? 'loading' : ''}`}
                      onClick={() => handleRemove(dev.id, "DEVELOPER", dev.username)}
                      disabled={assigning === dev.id || removing === dev.id}
                    >
                      {removing === dev.id ? 'Removing...' : 'Remove Project'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ViewDevelopers;
