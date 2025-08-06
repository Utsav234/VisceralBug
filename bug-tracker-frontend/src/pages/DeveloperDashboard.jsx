import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import axios from "../services/api";
import BugTable from "../components/BugTable";
import TaskForm from "../components/TaskForm";
import TaskReport from "./TaskReport";
import "../Styles/DeveloperDashboard.css";

function DeveloperDashboard() {
  const [bugs, setBugs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("assignedProjects");
  const [breachedBugs, setBreachedBugs] = useState([]);
  const [breachedLoading, setBreachedLoading] = useState(false);
  const [titleFilter, setTitleFilter] = useState("");
  const [statusVisibility, setStatusVisibility] = useState({
    ASSIGNED: true,
    IN_PROGRESS: true,
    RESOLVED: true,
  });
  const [timeFilters, setTimeFilters] = useState({
    ASSIGNED: "1",
    IN_PROGRESS: "1",
    RESOLVED: "1",
  });
  const [imageModal, setImageModal] = useState({ open: false, url: null });
  const [timelineModal, setTimelineModal] = useState({ open: false, logs: [], loading: false, bugTitle: "" });
  const [statusUpdateModal, setStatusUpdateModal] = useState({ open: false, bug: null });
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: "",
    notes: "",
    image: null,
    selectedDeveloper: "",
    submitting: false,
    error: ""
  });
  const [projectDevelopers, setProjectDevelopers] = useState([]);

  // Add highlight logic for tester reassignment requests
  const getHighlightedBugs = () => {
    try {
      return JSON.parse(localStorage.getItem('highlightedBugs') || '[]');
    } catch {
      return [];
    }
  };
  const [highlightedBugs, setHighlightedBugs] = useState(getHighlightedBugs());

  // Sync with localStorage on mount and when it changes
  useEffect(() => {
    setHighlightedBugs(getHighlightedBugs());
  }, []);

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setHighlightedBugs(getHighlightedBugs());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Add auto-refresh for color system (breach stage)
  useEffect(() => {
    const interval = setInterval(() => {
      setBugs(bugs => [...bugs]); // Force re-render to update color
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchBugs = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("/bugs/assigned", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Convert map objects back to bug-like objects for consistency
      const bugList = res.data.map(bugMap => ({
        id: bugMap.id,
        title: bugMap.title,
        description: bugMap.description,
        status: bugMap.status,
        priority: bugMap.priority,
        createdAt: bugMap.createdAt,
        lastStatusChange: bugMap.lastStatusChange,
        resolution: bugMap.resolution,
        project: bugMap.project,
        createdBy: bugMap.createdBy,
        assignedTo: bugMap.assignedTo,
        hasImage: bugMap.hasImage,
        wasBreached: bugMap.wasBreached // Add this if not present
      })).filter(bug => !bug.wasBreached); // Exclude breached bugs
      setBugs(bugList);
    } catch (error) {
      console.error("Failed to fetch bugs:", error);
    }
  };

  const fetchProjects = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("/projects/assigned", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const fetchTasks = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("/tasks/created", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  const fetchLogs = async (bug) => {
    setTimelineModal({ open: true, logs: [], loading: true, bugTitle: bug.title });
    setImageModal({ open: false, url: null });
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/bugs/${bug.id}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimelineModal({ open: true, logs: res.data, loading: false, bugTitle: bug.title });
      setImageModal({ open: false, url: null });
    } catch (err) {
      setTimelineModal({ open: true, logs: [], loading: false, bugTitle: bug.title });
      setImageModal({ open: false, url: null });
    }
  };

  const fetchBreachedBugs = async () => {
    setBreachedLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/bugs?breached=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBreachedBugs(res.data.map(b => b.bug ? { ...b.bug, breached: b.breached } : b));
    } catch (err) {
      setBreachedBugs([]);
    } finally {
      setBreachedLoading(false);
    }
  };

  useEffect(() => {
    fetchBugs();
    fetchTasks();
    fetchProjects();
  }, []);

  useEffect(() => {
    let interval;
    if (activeTab === "breached") {
      fetchBreachedBugs();
      interval = setInterval(fetchBreachedBugs, 30000); // 30 seconds
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "bugReports") {
      fetchBugs();
    }
  }, [activeTab]);

  useEffect(() => {
  if (activeTab === "assignedProjects") {
    fetchProjects();
  }
  if (activeTab === "bugReports") {
    fetchBugs();
  }
  if (activeTab === "taskReports") {
    fetchTasks();
    }
  }, [activeTab]);

  const getPriorityRank = (priority) => {
    switch (priority?.toUpperCase()) {
      case "HIGH":
        return 1;
      case "MEDIUM":
        return 2;
      case "LOW":
        return 3;
      default:
        return 4;
    }
  };

  const filterByTime = (bugs, timeFilter) => {
    if (timeFilter === "all") return bugs;

    const now = new Date();
    return bugs.filter((bug) => {
      const created = new Date(bug.createdAt);
      const diffInMs = now - created;
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

      if (timeFilter === "1") return diffInDays <= 1;
      if (timeFilter === "7") return diffInDays <= 7;
      if (timeFilter === "30") return diffInDays <= 30;
      return true;
    });
  };

  const groupBugsByStatus = () => {
    const filtered = bugs
      .filter(
        (b) =>
          b.title.toLowerCase().includes(titleFilter.toLowerCase()) &&
          !b.breached // Filter out breached bugs from regular report
      )
      .sort((a, b) => {
        const priorityDiff = getPriorityRank(a.priority) - getPriorityRank(b.priority);
        return priorityDiff !== 0 ? priorityDiff : a.id - b.id;
      });

    const grouped = {
      ASSIGNED: [],
      IN_PROGRESS: [],
      RESOLVED: [],
      CLOSED: [],
    };

    filtered.forEach((bug) => {
      const status = bug.status?.toUpperCase() || "ASSIGNED";
      if (grouped[status]) grouped[status].push(bug);
    });

    return grouped;
  };

  const handleToggleStatus = (status) => {
    setStatusVisibility((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const handleTimeChange = (status, value) => {
    setTimeFilters((prev) => ({
      ...prev,
      [status]: value,
    }));
  };

  const groupedBugs = groupBugsByStatus();

  // Add a handler to remove highlight after status update
  const handleStatusUpdate = (bugId) => {
    const highlighted = JSON.parse(localStorage.getItem('highlightedBugs') || '[]');
    const newIds = highlighted.filter(id => id !== bugId);
    localStorage.setItem('highlightedBugs', JSON.stringify(newIds));
    // Also update the local state
    setHighlightedBugs(newIds);
  };

  // Helper to get breach stage and time left
  function getBreachStage(bug) {
    if (!bug.lastStatusChange || bug.status === "RESOLVED" || bug.status === "CLOSED") return { stage: null, timeLeft: null };
    const now = new Date();
    const lastChange = new Date(bug.lastStatusChange);
    const elapsedMs = now - lastChange;
    // DEMO: Short times for testing
    const breachMs = 210 * 1000; // 3.5 min
    const stage1 = 30 * 1000;    // 30 sec
    const stage2 = 60 * 1000;    // 1 min
    const stage3 = 120 * 1000;   // 2 min
    if (bug.breached) return { stage: "blink", timeLeft: 0 };
    if (elapsedMs >= stage3) return { stage: "stage-3", timeLeft: breachMs - elapsedMs };
    if (elapsedMs >= stage2) return { stage: "stage-2", timeLeft: breachMs - elapsedMs };
    if (elapsedMs >= stage1) return { stage: "stage-1", timeLeft: breachMs - elapsedMs };
    return { stage: null, timeLeft: breachMs - elapsedMs };
  }

  function formatTimeLeft(ms) {
    if (ms <= 0) return "Breached!";
    const h = Math.floor(ms / (60 * 60 * 1000));
    const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    return `${h}h ${m}m left`;
  }

  // Helper to get full image URL for BLOB endpoint
  const getImageUrl = (bug) => {
    if (!bug || !bug.id) return "";
    return `http://localhost:8080/api/bugs/${bug.id}/original-image`;
  };

  // Open status update modal
  const openStatusUpdateModal = (bug) => {
    setStatusUpdateModal({ open: true, bug });
    setStatusUpdateForm({
      status: bug.status,
      notes: "",
      image: null,
      selectedDeveloper: "",
      submitting: false,
      error: ""
    });
    if (bug.project?.id) {
      fetchProjectDevelopers(bug.project.id);
    }
  };

  // Fetch project developers for reassignment
  const fetchProjectDevelopers = async (projectId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/projects/${projectId}/developers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjectDevelopers(res.data);
    } catch (err) {
      setProjectDevelopers([]);
    }
  };

  // Handle status update form submission
  const handleStatusUpdateSubmit = async (e) => {
    e.preventDefault();
    setStatusUpdateForm(prev => ({ ...prev, submitting: true, error: "" }));
    
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("status", statusUpdateForm.status);
      
      if (statusUpdateForm.status === "Assigned") {
        if (!statusUpdateForm.selectedDeveloper) {
          setStatusUpdateForm(prev => ({ ...prev, submitting: false, error: "Please select a developer to reassign to." }));
          return;
        }
        // For reassignment, use the existing assign endpoint
        await axios.put(`/bugs/${statusUpdateModal.bug.id}/assign/${statusUpdateForm.selectedDeveloper}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (statusUpdateForm.status === "RESOLVED" || statusUpdateForm.status === "IN_PROGRESS") {
        if (!statusUpdateForm.notes.trim() && !statusUpdateForm.image) {
          setStatusUpdateForm(prev => ({ ...prev, submitting: false, error: "Please provide notes or an image." }));
          return;
        }
        if (statusUpdateForm.notes) formData.append("resolution", statusUpdateForm.notes);
        if (statusUpdateForm.image) formData.append("image", statusUpdateForm.image);
        
        await axios.put(`/bugs/${statusUpdateModal.bug.id}/status`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      
      setStatusUpdateModal({ open: false, bug: null });
      setStatusUpdateForm({
        status: "",
        notes: "",
        image: null,
        selectedDeveloper: "",
        submitting: false,
        error: ""
      });
      fetchBugs();
      handleStatusUpdate(statusUpdateModal.bug.id);
    } catch (err) {
      setStatusUpdateForm(prev => ({ ...prev, submitting: false, error: "Error updating status" }));
    }
  };

  const renderSection = (statusLabel, bugsForStatus) => {
    const filteredBugs = filterByTime(bugsForStatus, timeFilters[statusLabel]);

    return (
      <div key={statusLabel} className="bug-status-section">
        <div className="bug-status-header">
          <h4>
            {statusLabel.replace("_", " ")} ({filteredBugs.length})
          </h4>
          <div>
            <label>Filter by time: </label>
            <select
              value={timeFilters[statusLabel]}
              onChange={(e) => handleTimeChange(statusLabel, e.target.value)}
            >            
              <option value="1">Last 1 Day</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="all">All</option>
            </select>
            <button onClick={() => handleToggleStatus(statusLabel)}>
              {statusVisibility[statusLabel] ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {statusVisibility[statusLabel] && (
          <div className="bug-cards">
            {filteredBugs.length === 0 ? (
              <div className="no-bugs-message">
                No bugs found for the selected time filter.
              </div>
            ) : (
              filteredBugs.map((bug) => {
                const { stage } = getBreachStage(bug);
                return (
                  <div key={bug.id} className={`card ${stage ? (stage === "blink" ? "breach-blink" : `breach-${stage}`) : ""}`}>
                    <h4>{bug.title}
                      {bug.breached && <span className="breach-label">BREACHED</span>}
                      {bug.status === "ASSIGNED" && <span className="assigned-label">ASSIGNED</span>}
                      {bug.status === "IN_PROGRESS" && <span className="inprogress-label">IN PROGRESS</span>}
                      {bug.status === "RESOLVED" && <span className="resolved-label">RESOLVED</span>}
                      {bug.status === "OPEN" && <span className="open-label">OPEN</span>}
                      {highlightedBugs.includes(bug.id) && <span className="reassigned-label">REASSIGNED</span>}
                    </h4>
                    <p><strong>Bug ID:</strong> {bug.id}</p>
                    <p><strong>Project:</strong> {bug.project?.name || "N/A"}</p>
                    <p><strong>Description:</strong> {bug.description}</p>
                    <p><strong>Status:</strong> {bug.status}</p>
                    <p><strong>Priority:</strong> {bug.priority}</p>
                    <p><strong>Created_At:</strong> {bug.createdAt}</p>
                    <p><strong>Resolution:</strong> {bug.resolution || "Not provided yet."}</p>
                    <p><strong>Tester Image:</strong> 
                      <span
                        style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}
                        onClick={e => { e.stopPropagation(); setImageModal({ open: true, url: getImageUrl(bug) }); }}
                      >
                        Image
                      </span>
                    </p>
                    <button style={{ margin: '0.5rem 0' }} onClick={e => { e.stopPropagation(); fetchLogs(bug); }}>View Logs</button>
                    {bug.status !== "CLOSED" && (
                      <button 
                        style={{ 
                          margin: '0.5rem 0', 
                          backgroundColor: '#2563eb', 
                          color: 'white', 
                          border: 'none', 
                          padding: '8px 16px', 
                          borderRadius: '4px', 
                          cursor: 'pointer' 
                        }} 
                        onClick={e => { e.stopPropagation(); openStatusUpdateModal(bug); }}
                      >
                        Status Update
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="developer-dashboard">
      <h2>Welcome, Developer 👨‍💻</h2>
      <p className="subtitle">View assigned projects and manage your bugs</p>

      <div className="developer-stats">
        <div className="stat-card">
          <h3>Assigned Projects</h3>
          <div className="value">{projects.length}</div>
        </div>
        <div className="stat-card">
          <h3>Active Bugs</h3>
          <div className="value">{bugs.filter((bug) => bug.status !== "CLOSED" && !bug.breached).length}</div>
        </div>
      </div>

      <div className="admin-tabs">
        <button onClick={() => setActiveTab("assignedProjects")}>📁 Assigned Projects</button>
        <button onClick={() => setActiveTab("bugReports")}>🐞 Bug Reports</button>
        <button onClick={() => setActiveTab("createTask")}>📝 Create Task</button>
        <button onClick={() => setActiveTab("taskReports")}>📋 Task Reports</button>
        <button onClick={() => setActiveTab("breached")}>⏰ Breached Bugs</button>
      </div>

      <div className="admin-content">
        {activeTab === "assignedProjects" && (
          <div className="bug-list">
            <h3>Assigned Projects</h3>
            {projects.length === 0 ? (
              <div className="no-projects">
                <i className="fas fa-folder-open"></i>
                <p>No projects assigned yet.</p>
              </div>
            ) : (
              <div className="assigned-projects-list">
                {projects.map((project) => (
                  <div key={project.id} className="project-card">
                    <div className="project-name">
                      <i className="fas fa-project-diagram"></i>
                      {project.name}
                    </div>
                    <div className="project-details">
                      <div className="project-detail">
                        <i className="fas fa-code-branch"></i>
                        <span>Project ID: {project.id}</span>
                      </div>
                    </div>
                    <p className="project-description">{project.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "bugReports" && (
          <div className="bug-list">
            <h3>Assigned Bugs</h3>
            <input
              type="text"
              className="input"
              placeholder="Filter by title..."
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
            />
            {["ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((status) =>
              renderSection(status, groupedBugs[status])
            )}
          </div>
        )}

        {activeTab === "createTask" && (
          <div className="task-form-section">
            <TaskForm onTaskCreated={fetchTasks} />
          </div>
        )}

        {activeTab === "taskReports" && (
          <TaskReport />
        )}

        {activeTab === "breached" && (
          <div className="bug-list">
            <h3>Breached Bugs</h3>
            <input
              type="text"
              className="bug-title-filter-input"
              placeholder="Search by title..."
              value={titleFilter}
              onChange={e => setTitleFilter(e.target.value)}
              style={{ marginBottom: 16, maxWidth: 320 }}
            />
            {breachedLoading ? (
              <p>Loading...</p>
            ) : breachedBugs.length === 0 ? (
              <p>No breached bugs found.</p>
            ) : (
              <div className="bug-cards">
                {breachedBugs
                  .filter(bug => bug.title && bug.title.toLowerCase().includes(titleFilter.toLowerCase()))
                  .map((bug) => {
                  const { stage, timeLeft } = getBreachStage(bug);
                  return (
                    <div key={bug.id} className={`card ${stage ? (stage === "blink" ? "breach-blink" : `breach-${stage}`) : ""}`}>
                      <h4>{bug.title}
                        {bug.breached && <span className="breach-label">BREACHED</span>}
                      </h4>
                      <p><strong>Bug ID:</strong> {bug.id}</p>
                      <p><strong>Project:</strong> {bug.project?.name || "N/A"}</p>
                      <p><strong>Description:</strong> {bug.description}</p>
                      <p><strong>Status:</strong> {bug.status}</p>
                      <p><strong>Priority:</strong> {bug.priority}</p>
                      <p><strong>Created_At:</strong> {bug.createdAt}</p>
                      <p><strong>Resolution:</strong> {bug.resolution || "Not provided yet."}</p>
                      <p><strong>Tester Image:</strong> 
                        <span
                          style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}
                          onClick={e => { e.stopPropagation(); setImageModal({ open: true, url: getImageUrl(bug) }); }}
                        >
                          Image
                        </span>
                      </p>
                      <button style={{ margin: '0.5rem 0' }} onClick={e => { e.stopPropagation(); fetchLogs(bug); }}>View Logs</button>
                        {bug.status !== "CLOSED" && (
                          <button 
                            className="status-update-btn"
                            onClick={e => { e.stopPropagation(); openStatusUpdateModal(bug); }}
                          >
                            Status Update
                          </button>
                        )}
                      {!bug.breached && timeLeft !== null && (
                        <div style={{ fontWeight: 500, color: '#ff6b6b', marginBottom: 4 }}>
                          {formatTimeLeft(timeLeft)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      {imageModal.open && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setImageModal({ open: false, url: null })}>
          <div
            className="modal-content"
            style={{
              background: 'transparent',
              boxShadow: 'none',
              padding: 0,
              borderRadius: 0,
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setImageModal({ open: false, url: null })}
              style={{
                position: 'absolute',
                top: 12,
                right: 18,
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 36,
                height: 36,
                fontSize: 22,
                cursor: 'pointer',
                zIndex: 1200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close image"
            >
              &times;
            </button>
            <img
              src={imageModal.url}
              alt="Bug"
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                display: 'block',
                margin: 'auto',
                borderRadius: 8,
                background: '#fff',
              }}
              onError={e => {
                e.target.onerror = null;
                e.target.src = '';
                e.target.alt = 'Image not found';
              }}
            />
          </div>
        </div>
      )}
      {timelineModal.open && ReactDOM.createPortal(
        <div className="modal-overlay">
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bug Timeline - {timelineModal.bugTitle}</h3>
              <button 
                className="close-button"
                onClick={() => setTimelineModal({ open: false, logs: [], loading: false, bugTitle: '', bugStatus: '' })}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
            {timelineModal.loading ? (
              <p>Loading...</p>
            ) : timelineModal.logs.length === 0 ? (
              <p>No logs found.</p>
            ) : (
                <ul
                  className={
                    timelineModal.logs.length === 1 ? 'single-log' : ''
                  }
                  style={{ listStyle: 'none', padding: 0 }}
                >
                {timelineModal.logs.map(log => (
                    <li key={log.id} className="log-entry">
                      <div className="log-header">
                        <span className="log-user">{log.user?.username || 'Unknown'}</span>
                        <span className="log-status">{log.status}</span>
                        <span className="log-time">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="log-content">
                        {log.text && <p className="log-text">{log.text}</p>}
                        {log.hasImage && (
                          <div className="log-image">
                            <img
                              src={`http://localhost:8080/api/bugs/logs/${log.id}/image`}
                              alt="Log attachment"
                              onClick={e => {
                                e.stopPropagation();
                                setImageModal({ open: true, url: `http://localhost:8080/api/bugs/logs/${log.id}/image` });
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                            <br />
                            <span
                              role="img-link"
                              onClick={e => {
                                e.stopPropagation();
                                setImageModal({ open: true, url: `http://localhost:8080/api/bugs/logs/${log.id}/image` });
                              }}
                            >
                              View Image
                            </span>
                      </div>
                    )}
                      </div>
                  </li>
                ))}
              </ul>
            )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Status Update Modal */}
      {statusUpdateModal.open && ReactDOM.createPortal(
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setStatusUpdateModal({ open: false, bug: null })}>
          <div className="modal-content" style={{ maxWidth: 500, width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Bug Status - {statusUpdateModal.bug?.title}</h3>
              <button 
                className="close-button"
                onClick={() => setStatusUpdateModal({ open: false, bug: null })}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleStatusUpdateSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Status:</label>
                  <select 
                    value={statusUpdateForm.status} 
                    onChange={e => setStatusUpdateForm(prev => ({ ...prev, status: e.target.value }))}
                    style={{ 
                      width: '100%', 
                      padding: '0.5rem', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="Assigned">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>

                {(statusUpdateForm.status === "RESOLVED" || statusUpdateForm.status === "IN_PROGRESS") && (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                        {statusUpdateForm.status === "RESOLVED" ? "Resolution:" : "Notes:"}
                      </label>
                      <textarea
                        placeholder={statusUpdateForm.status === "RESOLVED" ? "Enter resolution..." : "Enter notes or progress..."}
                        value={statusUpdateForm.notes}
                        onChange={(e) => setStatusUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                        style={{ 
                          width: '100%', 
                          minHeight: '80px', 
                          padding: '0.5rem',
                          border: '1px solid #cbd5e1', 
                          borderRadius: '6px',
                          fontSize: '14px',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Image (optional):</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setStatusUpdateForm(prev => ({ ...prev, image: e.target.files[0] }))}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </>
                )}

                {statusUpdateForm.status === "Assigned" && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Select Developer:</label>
                    <select
                      value={statusUpdateForm.selectedDeveloper}
                      onChange={(e) => setStatusUpdateForm(prev => ({ ...prev, selectedDeveloper: e.target.value }))}
                      style={{ 
                        width: '100%', 
                        padding: '0.5rem',
                        border: '1px solid #cbd5e1', 
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Select Developer to Reassign</option>
                      {projectDevelopers.map(dev => (
                        <option key={dev.id} value={dev.id}>{dev.username}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button 
                    type="button"
                    className="modal-close-btn"
                    onClick={() => setStatusUpdateModal({ open: false, bug: null })}
                    style={{ 
                      padding: '0.5rem 1rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      color: '#374151',
                      fontWeight: '500'
                    }}
                  >
                    Close
                  </button>
                  <button 
                    type="submit" 
                    className="modal-submit-btn"
                    disabled={statusUpdateForm.submitting}
                    style={{ 
                      padding: '0.5rem 1rem',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: statusUpdateForm.submitting ? 'not-allowed' : 'pointer',
                      opacity: statusUpdateForm.submitting ? 0.7 : 1,
                      fontWeight: '500'
                    }}
                  >
                    {statusUpdateForm.submitting ? "Updating..." : "Update Status"}
                  </button>
                </div>

                {statusUpdateForm.error && (
                  <div style={{ 
                    color: 'red', 
                    marginTop: '0.5rem', 
                    padding: '0.5rem',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '4px'
                  }}>
                    {statusUpdateForm.error}
                  </div>
                )}
              </form>
          </div>
        </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default DeveloperDashboard;
