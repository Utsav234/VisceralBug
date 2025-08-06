import React, { useState, useEffect } from 'react';
import axios from '../services/api';
import '../Styles/BugStatusUpdateForm.css';

const BugStatusUpdateForm = ({ bug, currentStatus, onUpdate }) => {
  const [status, setStatus] = useState(currentStatus);
  const [resolution, setResolution] = useState(bug.resolution || '');
  const [message, setMessage] = useState('');
  const [image, setImage] = useState(null);
  const [notes, setNotes] = useState("");
  // Add state for developers and selected developer:
  const [developers, setDevelopers] = useState([]);
  const [selectedDeveloper, setSelectedDeveloper] = useState("");

  // Add useEffect to fetch developers when status changes to "Assigned":
  useEffect(() => {
    if (status === "Assigned" && bug.project?.id) {
      fetchProjectDevelopers(bug.project.id);
    }
  }, [status, bug.project?.id]);

  const fetchProjectDevelopers = async (projectId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/projects/${projectId}/developers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDevelopers(res.data);
    } catch (err) {
      setDevelopers([]);
    }
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  // Update handleSubmit to handle developer reassignment:
  const handleSubmit = async e => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const formData = new FormData();
      formData.append("status", status);
      
      if (status === "Assigned") {
        if (!selectedDeveloper) {
          setMessage("Please select a developer to reassign to.");
          return;
        }
        // For reassignment, we'll use the existing assign endpoint
        await axios.put(`/bugs/${bug.id}/assign/${selectedDeveloper}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (status === "RESOLVED" || status === "IN_PROGRESS") {
        if (!notes.trim() && !image) {
          setMessage("Please provide notes or an image.");
          return;
        }
        if (notes) formData.append("resolution", notes);
        if (image) formData.append("image", image);
      await axios.put(`/bugs/${bug.id}/status`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      }
      
      setMessage("Status updated successfully!");
      onUpdate();
      setImage(null);
      setNotes("");
      setSelectedDeveloper("");
    } catch (err) {
      setMessage("Error updating status");
    }
  };

  return (
    <div className="status-update-form">
      {currentStatus === "CLOSED" ? (
        <div style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>
          <h4>Bug Closed</h4>
          <p>This bug has been closed and cannot be modified.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
      <h4>Update Status</h4>
      <select 
        value={status} 
        onChange={e => setStatus(e.target.value)}
        className="status-select"
      >
         <option value="Assigned">Assigned</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="RESOLVED">Resolved</option>
      </select>

      {(status === "RESOLVED" || status === "IN_PROGRESS") && (
        <>
          <div className="resolution-container">
            <textarea
              placeholder={status === "RESOLVED" ? "Enter resolution..." : "Enter notes or progress..."}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resolution-textarea"
            />
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={false}
          />
        </>
      )}
          {status === "Assigned" && (
            <div className="developer-selection-container">
              <select
                value={selectedDeveloper}
                onChange={(e) => setSelectedDeveloper(e.target.value)}
                className="developer-select"
                style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              >
                <option value="">Select Developer to Reassign</option>
                {developers.map(dev => (
                  <option key={dev.id} value={dev.id}>{dev.username}</option>
                ))}
              </select>
            </div>
          )}

      <button type="submit" className="update-button">
        Update Status
      </button>

      {message && (
        <p className={`status-message ${message.includes("Error") ? "error" : "success"}`}>
          {message}
        </p>
      )}
    </form>
      )}
    </div>
  );
};

export default BugStatusUpdateForm;
