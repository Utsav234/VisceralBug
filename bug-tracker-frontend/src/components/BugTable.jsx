import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from '../services/api';
import BugStatusUpdateForm from './BugStatusUpdateForm';
import '../Styles/BugTable.css';

function BugTable({ bugs, userRole = "ADMIN", onEdit, onAssignClick, developers = [] }) {
  const [selectedDevelopers, setSelectedDevelopers] = useState({});
  const [imageModal, setImageModal] = useState({ open: false, url: null });
  const [timelineModal, setTimelineModal] = useState({ open: false, logs: [], loading: false, bugTitle: "", bugStatus: "" });
  const [logForm, setLogForm] = useState({ text: "", image: null, submitting: false, error: "" });
  const [currentBugId, setCurrentBugId] = useState(null);
  const [testerActionModal, setTesterActionModal] = useState({ open: false, bug: null, action: null });
  const [testerModalText, setTesterModalText] = useState("");
  const [testerModalImage, setTesterModalImage] = useState(null);
  const [testerModalDeveloper, setTesterModalDeveloper] = useState("");
  const [testerModalSubmitting, setTesterModalSubmitting] = useState(false);
  const [testerModalError, setTesterModalError] = useState("");
  const [projectDevelopers, setProjectDevelopers] = useState([]);
  // Remove tester reassignment logic
  // Add state for confirmation modal and highlight
  const [reassignConfirm, setReassignConfirm] = useState({ open: false, bug: null });
  // Use localStorage to persist highlighted bug IDs
  const getHighlightedBugs = () => {
    try {
      return JSON.parse(localStorage.getItem('highlightedBugs') || '[]');
    } catch {
      return [];
    }
  };
  const setHighlightedBugsLS = (ids) => {
    localStorage.setItem('highlightedBugs', JSON.stringify(ids));
  };
  const [highlightedBugs, setHighlightedBugs] = useState(getHighlightedBugs());

  // On mount, sync state with localStorage
  useEffect(() => {
    setHighlightedBugs(getHighlightedBugs());
  }, []);

  // When highlight changes, update localStorage
  useEffect(() => {
    setHighlightedBugsLS(highlightedBugs);
  }, [highlightedBugs]);

  const handleDeveloperChange = (bugId, developerId) => {
    setSelectedDevelopers(prev => ({ ...prev, [bugId]: developerId }));
  };

  const fetchLogs = async (bug) => {
    setTimelineModal({ open: true, logs: [], loading: true, bugTitle: bug.title, bugStatus: bug.status });
    setImageModal({ open: false, url: null });
    setCurrentBugId(bug.id);
    setLogForm({ text: "", image: null, submitting: false, error: "" });
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/bugs/${bug.id}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimelineModal({ open: true, logs: res.data, loading: false, bugTitle: bug.title, bugStatus: bug.status });
      setImageModal({ open: false, url: null });
    } catch (err) {
      setTimelineModal({ open: true, logs: [], loading: false, bugTitle: bug.title, bugStatus: bug.status });
      setImageModal({ open: false, url: null });
    }
  };

  const handleLogFormChange = (e) => {
    const { name, value, files } = e.target;
    setLogForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
      error: ""
    }));
  };

  const handleLogFormSubmit = async (e) => {
    e.preventDefault();
    setLogForm((prev) => ({ ...prev, submitting: true, error: "" }));
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      if (logForm.text) formData.append("text", logForm.text);
      if (logForm.image) formData.append("image", logForm.image);
      await axios.post(`/bugs/${currentBugId}/log`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogForm({ text: "", image: null, submitting: false, error: "" });
      // Refresh logs
      const res = await axios.get(`/bugs/${currentBugId}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimelineModal((prev) => ({ ...prev, logs: res.data }));
    } catch (err) {
      setLogForm((prev) => ({ ...prev, submitting: false, error: "Failed to add log." }));
    }
  };

  // Helper to get full image URL
  const getImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (!url.startsWith("/")) url = "/" + url;
    // Always use backend host for images
    return `http://localhost:8080${encodeURI(url)}`;
  };

  // Helper to fetch developers for a project (for reassign)
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

  // Open modal for close or reassign
  const openTesterActionModal = (bug, action) => {
    setTesterActionModal({ open: true, bug, action });
    setTesterModalText("");
    setTesterModalImage(null);
    setTesterModalDeveloper("");
    setTesterModalError("");
    setProjectDevelopers([]);
    if (action === "reassign" && bug.project?.id) {
      fetchProjectDevelopers(bug.project.id);
    }
  };

  // Submit handler
  const handleTesterModalSubmit = async (e) => {
    e.preventDefault();
    setTesterModalSubmitting(true);
    setTesterModalError("");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      
      console.log("=== DEBUG: FormData Construction ===");
      console.log("Action:", testerActionModal.action);
      console.log("Text:", testerModalText);
      console.log("Image:", testerModalImage);
      console.log("Developer:", testerModalDeveloper);
      
      // Always add text field, even if empty, to ensure multipart/form-data is used
      const textValue = testerModalText || "No comment provided";
      formData.append("text", textValue);
      console.log("Added text:", textValue);
      
      if (testerModalImage) {
        formData.append("image", testerModalImage);
        console.log("Added image:", testerModalImage.name, testerModalImage.size);
      } else {
        console.log("No image to add");
      }
      
      if (testerActionModal.action === "reassign") {
        if (!testerModalDeveloper) {
          setTesterModalError("Please select a developer.");
          setTesterModalSubmitting(false);
          return;
        }
        const devId = testerModalDeveloper.toString();
        formData.append("developerId", devId);
        console.log("Added developerId:", devId);
      }
      
      const url = testerActionModal.action === "close"
        ? `/bugs/${testerActionModal.bug.id}/close-by-tester`
        : `/bugs/${testerActionModal.bug.id}/reassign-by-tester`;
        
      console.log("=== DEBUG: Request Details ===");
      console.log("URL:", url);
      console.log("Full URL:", `http://localhost:8080/api${url}`);
      console.log("FormData entries:");
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
      
      // Use fetch API for close/reassign to ensure correct multipart/form-data handling
      const fetchUrl = `http://localhost:8080/api${url}`;
      const fetchOptions = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
          // Do NOT set Content-Type for FormData!
        },
        body: formData,
        credentials: 'include',
      };
      const fetchResponse = await fetch(fetchUrl, fetchOptions);
      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text();
        throw new Error(`Failed: ${fetchResponse.status} - ${errorText}`);
      }
      // After successful close/reassign, fetch latest logs and update modal
      const logsRes = await fetch(`http://localhost:8080/api/bugs/${testerActionModal.bug.id}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const logsData = await logsRes.json();
      // Sort logs by timestamp descending
      const sortedLogs = logsData.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setTimelineModal({
        open: true,
        logs: sortedLogs,
        loading: false,
        bugTitle: testerActionModal.bug.title,
        bugStatus: 'CLOSED',
      });
      setTesterActionModal({ open: false, bug: null, action: null });
      setTesterModalSubmitting(false);
      setTesterModalText("");
      setTesterModalImage(null);
      setTesterModalDeveloper("");
      setTesterModalError("");
      // Refresh bug list if possible
      if (typeof window !== 'undefined' && window.location) {
        window.location.reload();
      }
    } catch (err) {
      console.error("=== DEBUG: Error Details ===");
      console.error("Error:", err);
      console.error("Error response:", err.response);
      console.error("Error message:", err.message);
      setTesterModalError("Failed to submit. Please try again.");
      setTesterModalSubmitting(false);
    }
  };
  
  // Replace reassign button logic
  const handleTesterReassignClick = (bug) => {
    setReassignConfirm({ open: true, bug });
  };
  const confirmTesterReassign = () => {
    const newIds = Array.from(new Set([...getHighlightedBugs(), reassignConfirm.bug.id]));
    setHighlightedBugs(newIds);
    setHighlightedBugsLS(newIds);
    setReassignConfirm({ open: false, bug: null });
  };
  
  // Remove highlight after developer status change
  const handleStatusUpdate = (bugId) => {
    const newIds = getHighlightedBugs().filter(id => id !== bugId);
    setHighlightedBugs(newIds);
    setHighlightedBugsLS(newIds);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW': return '#28a745';
      case 'MEDIUM': return '#ffc107';
      case 'HIGH': return '#fd7e14';
      case 'CRITICAL': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'NEW': return '#007bff';
      case 'OPEN': return '#6f42c1';
      case 'ASSIGNED': return '#fd7e14';
      case 'IN_PROGRESS': return '#ffc107';
      case 'RESOLVED': return '#28a745';
      case 'CLOSED': return '#6c757d';
      default: return '#6c757d';
    }
  };

  return (
    <div className="bug-table-container">
      {imageModal.open && ReactDOM.createPortal(
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
              src={getImageUrl(imageModal.url)}
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
        </div>,
        document.body
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
              {/* Log form for IN_PROGRESS and developer */}
              {timelineModal.bugStatus === "IN_PROGRESS" && userRole === "DEVELOPER" && (
                <form onSubmit={handleLogFormSubmit} style={{ marginTop: 24, borderTop: '1px solid #eee', paddingTop: 16 }}>
                  <h4>Add Progress Log</h4>
                  <textarea
                    name="text"
                    value={logForm.text}
                    onChange={handleLogFormChange}
                    placeholder="Describe your progress..."
                    style={{ width: '100%', minHeight: 60, marginBottom: 8 }}
                    disabled={logForm.submitting}
                  />
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleLogFormChange}
                    disabled={logForm.submitting}
                  />
                  <button type="submit" disabled={logForm.submitting} style={{ marginLeft: 8 }}>
                    {logForm.submitting ? "Adding..." : "Add Log"}
                  </button>
                  {logForm.error && <div style={{ color: 'red', marginTop: 8 }}>{logForm.error}</div>}
                </form>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
      {testerActionModal.open && ReactDOM.createPortal(
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setTesterActionModal({ open: false, bug: null, action: null })}>
          <div className="modal-content" style={{ maxWidth: 400, width: '90%' }} onClick={e => e.stopPropagation()}>
            <h3>{testerActionModal.action === "close" ? "Close Bug" : "Reassign Bug"}</h3>
            <form onSubmit={handleTesterModalSubmit}>
              <textarea
                placeholder="Enter your comments..."
                value={testerModalText}
                onChange={e => setTesterModalText(e.target.value)}
                style={{ width: '100%', minHeight: 60, marginBottom: 12 }}
                disabled={testerModalSubmitting}
              />
              <input
                type="file"
                accept="image/*"
                onChange={e => setTesterModalImage(e.target.files[0])}
                disabled={testerModalSubmitting}
              />
              {testerActionModal.action === "reassign" && (
                <select
                  value={testerModalDeveloper}
                  onChange={e => setTesterModalDeveloper(e.target.value)}
                  style={{ width: '100%', margin: '12px 0' }}
                  disabled={testerModalSubmitting}
                >
                  <option value="">Select Developer</option>
                  {projectDevelopers.map(dev => (
                    <option key={dev.id} value={dev.id}>{dev.username}</option>
                  ))}
                </select>
              )}
              <button type="submit" disabled={testerModalSubmitting} style={{ marginTop: 8 }}>
                {testerModalSubmitting ? "Submitting..." : testerActionModal.action === "close" ? "Close Bug" : "Reassign Bug"}
              </button>
              {testerModalError && <div style={{ color: 'red', marginTop: 8 }}>{testerModalError}</div>}
            </form>
            <button onClick={() => setTesterActionModal({ open: false, bug: null, action: null })} style={{ marginTop: 12 }}>Cancel</button>
          </div>
        </div>,
        document.body
      )}
      {reassignConfirm.open && ReactDOM.createPortal(
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setReassignConfirm({ open: false, bug: null })}>
          <div className="modal-content" style={{ maxWidth: 400, width: '90%' }} onClick={e => e.stopPropagation()}>
            <h3>Request Developer Reassignment</h3>
            <p>Are you sure you want to request the developer to reassign this bug?</p>
            <button onClick={confirmTesterReassign} style={{ marginTop: 8 }}>Yes, Notify Developer</button>
            <button onClick={() => setReassignConfirm({ open: false, bug: null })} style={{ marginTop: 8 }}>Cancel</button>
          </div>
        </div>,
        document.body
      )}
      <table className="bug-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Project</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th>Created By</th>
            <th>View Timeline/Logs</th>
            {userRole === "ADMIN" && bugs.some(bug => !bug.assignedTo) && <th>Assign Developer</th>}
            {userRole === "ADMIN" && <th>Actions</th>}
            {userRole === "TESTER" && bugs.some(bug => bug.status === "RESOLVED") && <th>Actions</th>}
            <th>Resolution</th>
          </tr>
        </thead>
        <tbody>
          {bugs.map(bug => (
            <tr key={bug.id} className={highlightedBugs.includes(bug.id) ? 'highlight-admin-reassign' : ''}>
              <td>{bug.title}</td>
              <td>{bug.description || "No description"}</td>
              <td>{bug.project?.name || "N/A"}</td>
              <td>
                <span 
                  className="priority-badge"
                  style={{ backgroundColor: getPriorityColor(bug.priority) }}
                >
                  {bug.priority}
                </span>
              </td>
              <td>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(bug.status) }}
                >
                  {bug.status}
                </span>
              </td>
              <td>{bug.assignedTo?.username || "Unassigned"}</td>
              <td>{bug.createdBy?.username || "Unknown"}</td>
              <td>
                <button onClick={e => { e.stopPropagation(); fetchLogs(bug); }}>View Logs</button>
              </td>
              {userRole === "ADMIN" && !bug.assignedTo && (
                <td>
                  <select
                    value={selectedDevelopers[bug.id] || ""}
                    onChange={(e) => handleDeveloperChange(bug.id, e.target.value)}
                  >
                    <option value="">Select</option>
                    {developers
                      .filter(dev => dev.assignedAsDeveloper?.some(p => p.id === bug.project?.id))
                      .map(dev => (
                        <option key={dev.id} value={dev.id}>{dev.username}</option>
                      ))}
                  </select>
                </td>
              )}
              {userRole === "ADMIN" && (
                <td>
                  {!bug.assignedTo && (
                    <button
                      onClick={() => {
                        const devId = selectedDevelopers[bug.id];
                        if (!devId) {
                          alert("Please select a developer.");
                          return;
                        }
                        onAssignClick(bug.id, devId);
                      }}
                    >
                      Assign
                    </button>
                  )}
                  {bug.assignedTo && (
                    <button
                      onClick={() => {
                        if (!bug.id) {
                          alert("Bug ID is undefined. Cannot update status.");
                          return;
                        }
                        onEdit?.(bug);
                      }}
                    >
                      Update
                    </button>
                  )}
                </td>
              )}
              {userRole === "TESTER" && bug.status === "RESOLVED" && (
                <td>
                  <button style={{ marginRight: 8 }} onClick={() => openTesterActionModal(bug, "close")}>Close</button>
                  <button onClick={() => handleTesterReassignClick(bug)}>Reassign</button>
                </td>
              )}
              <td>
                {userRole === "DEVELOPER" && bug.status === "IN_PROGRESS" ? (
                  <input
                    type="text"
                    value={bug.resolution || ""}
                    onChange={(e) => onEdit?.({ ...bug, resolution: e.target.value })}
                    placeholder="Enter resolution"
                  />
                ) : (
                  bug.resolution || "\u2014"
                )}
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BugTable;