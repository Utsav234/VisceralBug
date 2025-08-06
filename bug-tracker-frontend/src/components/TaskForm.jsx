import React, { useState, useEffect } from 'react';
import axios from '../services/api';
import '../Styles/TaskForm.css';

const TaskForm = ({ onTaskCreated }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM',
        projectId: ''
    });
    const [image, setImage] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/projects/assigned', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjects(response.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setError('Failed to fetch projects');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    const clearForm = () => {
        setFormData({
            title: '',
            description: '',
            priority: 'MEDIUM',
            projectId: ''
        });
        setImage(null);
        setError('');
        // Reset file input
        const fileInput = document.getElementById('image');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('priority', formData.priority);
            formDataToSend.append('projectId', formData.projectId);
            if (image) {
                formDataToSend.append('image', image);
            }

            await axios.post('/tasks', formDataToSend, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Reset form
            setFormData({
                title: '',
                description: '',
                priority: 'MEDIUM',
                projectId: ''
            });
            setImage(null);
            if (onTaskCreated) {
                onTaskCreated();
            }
        } catch (error) {
            console.error('Error creating task:', error);
            setError('Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="task-form-container">
            <h2>Create New Task</h2>
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit} className="task-form">
                <div className="form-group">
                    <label htmlFor="title">Task Title:</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter task title"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description:</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter task description"
                        rows="4"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="priority">Priority:</label>
                    <select
                        id="priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                       
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="projectId">Project:</label>
                    <select
                        id="projectId"
                        name="projectId"
                        value={formData.projectId}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">Select a project</option>
                        {projects.map(project => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="image">Image (Optional):</label>
                    <input
                        type="file"
                        id="image"
                        name="image"
                        onChange={handleImageChange}
                        accept="image/*"
                    />
                </div>

                <div className="button-group">
                    <button type="submit" disabled={loading} className="submit-btn">
                        {loading ? 'Creating Task...' : 'Create Task'}
                    </button>
                    <button 
                        type="button" 
                        onClick={clearForm}
                        disabled={loading}
                        className="clear-btn"
                    >
                        🗑️ Clear
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TaskForm; 