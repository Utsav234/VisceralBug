// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import ManageProjects from "./ManageProjects";
import ViewDevelopers from "./ViewDevelopers";
import ViewTesters from "./ViewTesters";
import BugReport from "./BugReport";
import TaskReport from "./TaskReport";
import Register from "../components/RegisterForm";
import '../Styles/AdminDashboard.css';  
import axios from "../services/api";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("projects");
  const [breachedBugs, setBreachedBugs] = useState([]);
  const [breachedLoading, setBreachedLoading] = useState(false);
  const [bugs, setBugs] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success', 'error', 'warning'

  const showMessage = useCallback((msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  }, []);

  const fetchBugs = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/bugs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Map to flat bug objects with breached property
      const bugList = res.data.map(b => b.bug ? { ...b.bug, breached: b.breached } : b);
      setBugs(bugList);
    } catch (err) {
      console.error("Failed to fetch bugs:", err);
      setBugs([]);
      showMessage("❌ Failed to load bug reports. Please refresh the page.", "error");
    }
  }, [showMessage]);

  const fetchBreachedBugs = useCallback(async () => {
    setBreachedLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/bugs?breached=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBreachedBugs(res.data.map(b => b.bug)); // Unwrap bug property
    } catch (err) {
      console.error("Failed to fetch breached bugs:", err);
      setBreachedBugs([]);
      showMessage("❌ Failed to load breached bugs. Please refresh the page.", "error");
    } finally {
      setBreachedLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

  useEffect(() => {
    let interval;
    if (activeTab === "breached") {
      fetchBreachedBugs();
      interval = setInterval(fetchBreachedBugs, 30000); // 30 seconds
    }
    return () => clearInterval(interval);
  }, [activeTab, fetchBreachedBugs]);

  useEffect(() => {
    if (activeTab === "projects") {
      fetchBugs();
    }
    if (activeTab === "bugs") {
      fetchBugs();
    }
  }, [activeTab, fetchBugs]);

  const handleAssignClick = async (bugId, developerId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`/bugs/${bugId}/assign/${developerId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showMessage("✅ Bug assigned successfully to developer!", "success");
      // Always refetch the full bug list after assignment
      fetchBugs();
    } catch (err) {
      console.error("Error assigning bug:", err);
      if (err.response) {
        const errorMessage = err.response.data;
        if (errorMessage.includes("not found")) {
          showMessage("❌ Bug or developer not found.", "error");
        } else if (errorMessage.includes("already assigned")) {
          showMessage("❌ Bug is already assigned to a developer.", "error");
        } else {
          showMessage(`❌ Failed to assign bug: ${errorMessage}`, "error");
        }
      } else if (err.request) {
        showMessage("❌ Network error. Please check your connection.", "error");
      } else {
        showMessage("❌ An unexpected error occurred.", "error");
      }
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

  const renderContent = () => {
    switch (activeTab) {
      case "projects":
        return <ManageProjects />;
      case "viewdevelopers":
        return <ViewDevelopers />;
      case "viewtesters":
        return <ViewTesters />;
      case "register":
        return <Register />;
      case "bugs":
        return <BugReport userRole="ADMIN" bugsOverride={bugs} onAssignClick={handleAssignClick} />;
      case "tasks":
        return <TaskReport />;
      case "breached":
        console.log("[AdminDashboard] Breached bugs for BugReport:", breachedBugs);
        return (
          <div className="bug-list">
            <h3>Breached Bugs</h3>
            {breachedLoading ? (
              <p>Loading...</p>
            ) : breachedBugs.length === 0 ? (
              <p>No breached bugs found.</p>
            ) : (
              <BugReport userRole="ADMIN" bugsOverride={breachedBugs} onAssignClick={handleAssignClick} />
            )}
          </div>
        );
      default:
        return <ManageProjects />;
    }
  };

  return (
    <div className="admin-dashboard">
      <h2>Welcome, Admin 👑</h2>
      <p className="subtitle">Manage projects and bug reports</p>

      {message && (
        <div className="message-box" style={getMessageStyle()}>
          {message}
        </div>
      )}

      <div className="admin-tabs">
        <button onClick={() => setActiveTab("projects")}>📁 Projects</button>
        <button onClick={() => setActiveTab("viewdevelopers")}>👨‍💻 Developers</button>
        <button onClick={() => setActiveTab("viewtesters")}>🧪 Testers</button>
        <button onClick={() => setActiveTab("register")}>➕ Add User</button>
        <button onClick={() => setActiveTab("bugs")}>🐞 Bug Reports</button>
        <button onClick={() => setActiveTab("tasks")}>📋 Task Reports</button>
        <button onClick={() => setActiveTab("breached")}>⏰ Breached Bugs</button>
      </div>

      <div className="admin-content">{renderContent()}</div>
    </div>
  );
}

export default AdminDashboard;
