import React, { useState, useEffect } from "react";
import "../Styles/TesterDashboard.css"; 
import BugReport from "./BugReport";
import AssignedProjects from "../components/AssignedProjects";
import BugForm from "../components/BugForm";
import TaskReport from "./TaskReport";
import axios from "../services/api";

function TesterDashboard() {
  const [activeTab, setActiveTab] = useState("projects");
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [breachedBugs, setBreachedBugs] = useState([]);
  const [breachedLoading, setBreachedLoading] = useState(false);

  const fetchAssignedTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/tasks/assigned", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignedTasks(res.data);
    } catch (error) {
      console.error("Failed to fetch assigned tasks:", error);
    }
  };

  const fetchBreachedBugs = async () => {
    setBreachedLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/bugs?breached=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBreachedBugs(res.data.map(b => b.bug)); // Unwrap bug property
    } catch (err) {
      setBreachedBugs([]);
    } finally {
      setBreachedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "assignedTasks") {
      fetchAssignedTasks();
    }
    if (activeTab === "bugs") {
      // If you have a fetchBugs function for tester, call it here
      // fetchBugs();
    }
    if (activeTab === "assignproject") {
      // If you have a fetchAssignedProjects function, call it here
      // fetchAssignedProjects();
    }
  }, [activeTab]);

  useEffect(() => {
    let interval;
    if (activeTab === "breached") {
      fetchBreachedBugs();
      interval = setInterval(fetchBreachedBugs, 30000); // 30 seconds
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case "assignproject":
        return <AssignedProjects />;
      case "create":
        return <BugForm />;
      case "bugs":
        return <BugReport userRole="TESTER" />;
      case "assignedTasks":
        return <TaskReport onNavigateToCreateBug={() => setActiveTab("create")} />;
      case "breached":
        console.log("[TesterDashboard] Breached bugs for BugReport:", breachedBugs);
        return (
          <div className="bug-list">
            <h3>Breached Bugs</h3>
            {breachedLoading ? (
              <p>Loading...</p>
            ) : breachedBugs.length === 0 ? (
              <p>No breached bugs found.</p>
            ) : (
              <BugReport userRole="TESTER" bugsOverride={breachedBugs} />
            )}
          </div>
        );
      default:
        return <BugReport userRole="TESTER" />;
    }
  };

  return (
    <div className="tester-dashboard">
      <h2>Welcome, Tester 🧪</h2>
      <p className="subtitle">View assigned projects and manage bug reports</p>

      <div className="admin-tabs">
        <button onClick={() => setActiveTab("assignproject")}>📁 Assigned Projects</button>
        <button onClick={() => setActiveTab("create")}>➕ Create Bug</button>
        <button onClick={() => setActiveTab("bugs")}>🐞 Bug Reports</button>
        <button onClick={() => setActiveTab("assignedTasks")}>📋 Assigned Tasks</button>
        <button onClick={() => setActiveTab("breached")}>⏰ Breached Bugs</button>
      </div>

      <div className="admin-content">{renderContent()}</div>
    </div>
  );
}

export default TesterDashboard;
