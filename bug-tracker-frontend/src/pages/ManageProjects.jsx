import React, { useEffect, useState } from "react";
import axios from "../services/api";
import ProjectForm from "../components/ProjectForm";
import "../Styles/ManageProjects.css";

const ManageProjects = () => {
  const [projects, setProjects] = useState([]);

  const fetchProjects = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get("/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(response.data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="manage-projects">
      <h2>Manage Projects 📁</h2>
      
      <div className="project-form">
        <ProjectForm onCreated={fetchProjects} />
      </div>

      <div className="manage-projects-list">
        <h3>Existing Projects</h3>
        <div className="manage-projects-table-container">
          <table className="manage-projects-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Developers</th>
                <th>Testers</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => (
                <tr key={project.id}>
                  <td>{project.id}</td>
                  <td>{project.name}</td>
                  <td>{project.description}</td>
                  <td>{project.developers?.map(dev => dev.username).join(', ') || 'None'}</td>
                  <td>{project.testers?.map(tester => tester.username).join(', ') || 'None'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageProjects;
