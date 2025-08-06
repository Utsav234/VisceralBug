import React, { useEffect, useState } from "react";
import axios from '../services/api';
import "../Styles/BugForm.css"

function BugForm({ onSubmitSuccess = () => {} }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "LOW",
    projectId: "",
  });
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchAssignedProjects = async () => {
      setIsLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get('/projects/assigned', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProjects(res.data);
      } catch (error) {
        setError("Failed to load projects. Please try again.");
        console.error("Error loading projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignedProjects();
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); 
    setSuccess(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setError("");
    setSuccess(false);
    
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        setImage(null);
        setImagePreview(null);
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError("Please select a valid image file");
        setImage(null);
        setImagePreview(null);
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess(false);
    
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("bug", new Blob([JSON.stringify({
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        project: { id: form.projectId },
      })], { type: "application/json" }));
      
      if (image) formData.append("image", image);
      
      const res = await axios.post(
        "/bugs",
        formData,
        {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        }
      );
      
      console.log("Bug submitted:", res.data);
      setSuccess(true);
      onSubmitSuccess();
      
      // Reset form
      setForm({ title: "", description: "", priority: "LOW", projectId: "" });
      setImage(null);
      setImagePreview(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (error) {
      setError(error.response?.data?.message || "Failed to submit bug. Please try again.");
      console.error("Bug submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearForm = () => {
    setForm({ title: "", description: "", priority: "LOW", projectId: "" });
    setImage(null);
    setImagePreview(null);
    setError("");
    setSuccess(false);
  };

  return (
    <div className="bug-form-container">
      <form className="bug-form" onSubmit={handleSubmit}>
        <h3>🐛 Report Bug</h3>
        
        {error && <div className="error-message">{error}</div>}
        {success && (
          <div style={{
            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
            color: '#065f46',
            padding: '1rem',
            borderRadius: '8px',
            borderLeft: '4px solid #10b981',
            fontWeight: '600',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            ✅ Bug reported successfully!
          </div>
        )}
        
        <input
          type="text"
          name="title"
          placeholder="Enter bug title..."
          value={form.title}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          maxLength={100}
        />
        
        <textarea
          name="description"
          placeholder="Describe the bug in detail..."
          value={form.description}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          maxLength={1000}
        />
        
        <select 
          name="priority" 
          value={form.priority} 
          onChange={handleChange}
          disabled={isSubmitting}
        >
          <option value="LOW">🟢 Low Priority</option>
          <option value="MEDIUM">🟡 Medium Priority</option>
          <option value="HIGH">🔴 High Priority</option>
        </select>
        
        <select 
          name="projectId" 
          value={form.projectId} 
          onChange={handleChange} 
          required
          disabled={isLoading || isSubmitting}
        >
          <option value="">📁 Select Project</option>
          {projects.map(proj => (
            <option key={proj.id} value={proj.id}>
              {proj.name}
            </option>
          ))}
        </select>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '600', 
            color: '#374151' 
          }}>
            📷 Attach Screenshot (Optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={isSubmitting}
          />
          {imagePreview && (
            <img src={imagePreview} alt="Preview" style={{ 
              maxWidth: '200px', 
              marginTop: '10px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              border: '2px solid #e5e7eb'
            }} />
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            type="submit" 
            disabled={isSubmitting || isLoading}
            style={{ flex: 2 }}
          >
            {isSubmitting ? "🔄 Submitting..." : "🚀 Submit Bug"}
          </button>
          <button 
            type="button" 
            onClick={clearForm}
            disabled={isSubmitting}
            style={{ 
              flex: 1,
              background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '1.2rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            🗑️ Clear
          </button>
        </div>
      </form>
    </div>
  );
}

export default BugForm;