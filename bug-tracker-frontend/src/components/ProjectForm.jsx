import React, { useState } from "react";
import axios from "../services/api";
import '../Styles/ProjectForm.css';

function ProjectForm({ onCreated }) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success', 'error', 'warning'
  const [errors, setErrors] = useState({});

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (form.name.length < 3) {
      newErrors.name = 'Project name must be at least 3 characters';
    }
    
    if (!form.description.trim()) {
      newErrors.description = 'Project description is required';
    } else if (form.description.length < 10) {
      newErrors.description = 'Project description must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showMessage('Please fix the errors in the form', 'error');
      return;
    }
    
    setIsSubmitting(true);
    setMessage('');
    const token = localStorage.getItem('token');

    try {
      await axios.post('/projects', {
        name: form.name.trim(),
        description: form.description.trim(),
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      showMessage('✅ Project created successfully! 🎉', 'success');
      setForm({ name: "", description: "" });
      setErrors({});
      
      // Call the callback to refresh the project list
      if (onCreated) {
        onCreated();
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      
      if (error.response) {
        const errorMessage = error.response.data;
        if (errorMessage.includes("already exists")) {
          showMessage('❌ A project with this name already exists.', 'error');
        } else if (errorMessage.includes("unauthorized")) {
          showMessage('❌ You are not authorized to create projects.', 'error');
        } else {
          showMessage(`❌ Failed to create project: ${errorMessage}`, 'error');
        }
      } else if (error.request) {
        showMessage('❌ Network error. Please check your connection and try again.', 'error');
      } else {
        showMessage('❌ An unexpected error occurred. Please try again.', 'error');
      }
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="create-project-container">
      <form onSubmit={handleSubmit} className="create-project-form">
        <h3 className="create-project-title">Create Project</h3>
        
        {message && (
          <div className="message-box" style={getMessageStyle()}>
            {message}
          </div>
        )}
        
        <div className="create-project-row">
          <div className="create-project-group">
            <input
              type="text"
              name="name"
              placeholder="Project Name"
              value={form.name}
              onChange={handleChange}
              className={`create-project-input ${errors.name ? 'error-input' : ''}`}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="create-project-group">
            <textarea
              name="description"
              placeholder="Project Description"
              value={form.description}
              onChange={handleChange}
              className={`create-project-textarea ${errors.description ? 'error-input' : ''}`}
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>
        </div>

        <button 
          type="submit" 
          className={`create-project-button ${isSubmitting ? 'submitting' : ''}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Project'}
        </button>
      </form>
    </div>
  );
}

export default ProjectForm;
