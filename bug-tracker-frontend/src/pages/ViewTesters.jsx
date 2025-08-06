import React, { useEffect, useState } from "react";
import axios from "../services/api";
import '../Styles/ViewTesters.css';

const ViewTesters = () => {
  const [testers, setTesters] = useState([]);
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
    const fetchTesters = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get("/auth/users?role=TESTER", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTesters(response.data);
      } catch (error) {
        console.error("Failed to fetch testers", error);
        showMessage("❌ Failed to load testers. Please refresh the page.", "error");
      } finally {
        setLoading(false);
      }
    };
   fetchTesters();
  }, []);

  const filteredTesters = testers.filter((tester) =>
    tester.username.toLowerCase().includes(search.toLowerCase())
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
      <div className="view-testers-container">
        <h2 className="view-testers-title">View Testers</h2>
        <div className="loading-message">Loading testers...</div>
      </div>
    );
  }

  return (
    <div className="view-testers-container">
      <h2 className="view-testers-title">View Testers</h2>
      
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
      
      <div className="testers-table-container">
        {filteredTesters.length === 0 ? (
          <div className="no-data-message">
            {search ? "No testers found matching your search." : "No testers available."}
          </div>
        ) : (
          <table className="testers-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTesters.map((tester) => (
                <tr key={tester.id}>
                  <td>{tester.id}</td>
                  <td>{tester.username}</td>
                  <td className="action-buttons">
                    <button 
                      className={`assign-button ${assigning === tester.id ? 'loading' : ''}`}
                      onClick={() => handleAssignProject(tester.id, "TESTER", tester.username)}
                      disabled={assigning === tester.id || removing === tester.id}
                    >
                      {assigning === tester.id ? 'Assigning...' : 'Assign Project'}
                    </button>
                    <button 
                      className={`remove-button ${removing === tester.id ? 'loading' : ''}`}
                      onClick={() => handleRemove(tester.id, "TESTER", tester.username)}
                      disabled={assigning === tester.id || removing === tester.id}
                    >
                      {removing === tester.id ? 'Removing...' : 'Remove Project'}
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

export default ViewTesters;
