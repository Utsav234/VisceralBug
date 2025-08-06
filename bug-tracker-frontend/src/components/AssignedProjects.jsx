import React, { useEffect, useState } from 'react';
import axios from '../services/api';
import '../Styles/AssignedProjects.css';

const AssignedProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssignedProjects = async () => {
      const token = localStorage.getItem("token");
      try {
        setLoading(true);
        const res = await axios.get("/projects/assigned", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Assigned projects fetched:", res.data);
        setProjects(res.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch assigned projects:", err.response?.data || err.message);
        setError("Failed to load assigned projects. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedProjects();
  }, []);

  if (loading) {
    return (
      <div className="assigned-projects-container">
        <div className="loading-projects">
          <i className="fas fa-spinner"></i>
          Loading projects...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="assigned-projects-container">
        <div className="no-projects">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="assigned-projects-container">
        <div className="no-projects">
          <i className="fas fa-folder-open"></i>
          <p>No projects assigned yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="assigned-projects-container">
      <div className="assigned-projects-header">
        <h2 className="assigned-projects-title">Assigned Projects</h2>
      </div>
      
      <div className="assigned-projects-list">
        {projects.map(project => (
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
    </div>
  );
};

export default AssignedProjects;
