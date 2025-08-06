import React, { useState } from 'react';
import axios from 'axios';
import ReactDOM from 'react-dom';
import '../Styles/TaskTable.css';

const TaskTable = ({ tasks, onTaskUpdated, userRole = "TESTER", onAssignClick, testers = [], onNavigateToCreateBug }) => {
    const [timelineModal, setTimelineModal] = useState({ open: false, logs: [], loading: false, taskTitle: '', taskStatus: '' });
    const [imageModal, setImageModal] = useState({ open: false, imageUrl: '', title: '' });
    const [testerActionModal, setTesterActionModal] = useState({ open: false, task: null, action: '', comment: '', image: null });

    const handleViewLogs = async (task) => {
        setTimelineModal(prev => ({ ...prev, open: true, loading: true, taskTitle: task.title, taskStatus: task.status }));
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:8080/api/tasks/${task.id}/logs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const sortedLogs = response.data.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setTimelineModal({
                open: true,
                logs: sortedLogs,
                loading: false,
                taskTitle: task.title,
                taskStatus: task.status
            });
        } catch (error) {
            console.error('Error fetching task logs:', error);
            setTimelineModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleImageClick = (imageUrl, title) => {
        setImageModal({ open: true, imageUrl, title });
    };

    const handleTesterAction = (task, action) => {
        setTesterActionModal({ open: true, task, action, comment: '', image: null });
    };

    const handleTesterModalSubmit = async () => {
        const { task, action, comment, image } = testerActionModal;
        
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('comment', comment);
            if (image) {
                formData.append('image', image);
            }

            const url = action === 'close' ? `/tasks/${task.id}/close-by-tester` : '';
            
            const fetchUrl = `http://localhost:8080/api${url}`;
            const fetchOptions = {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData,
                credentials: 'include',
            };
            
            const fetchResponse = await fetch(fetchUrl, fetchOptions);
            if (!fetchResponse.ok) {
                const errorText = await fetchResponse.text();
                throw new Error(`Failed: ${fetchResponse.status} - ${errorText}`);
            }

            // After successful close, fetch latest logs and update modal
            const logsRes = await fetch(`http://localhost:8080/api/tasks/${task.id}/logs`, {
                headers: { Authorization: `Bearer ${token}` },
                credentials: 'include',
            });
            const logsData = await logsRes.json();
            const sortedLogs = logsData.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setTimelineModal({
                open: true,
                logs: sortedLogs,
                loading: false,
                taskTitle: task.title,
                taskStatus: 'CLOSED',
            });

            setTesterActionModal({ open: false, task: null, action: '', comment: '', image: null });
            if (onTaskUpdated) {
                onTaskUpdated();
            }
        } catch (error) {
            console.error('Error performing tester action:', error);
            if (error.message.includes('already closed')) {
                alert('This task is already closed.');
                setTesterActionModal({ open: false, task: null, action: '', comment: '', image: null });
                if (onTaskUpdated) {
                    onTaskUpdated();
                }
            } else {
                alert('Failed to perform action: ' + error.message);
            }
        }
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
            case 'UNASSIGNED': return '#6c757d';
            case 'ASSIGNED': return '#007bff';
            case 'CLOSED': return '#28a745';
            default: return '#6c757d';
        }
    };

    return (
        <div className="task-table-container">
            <table className="task-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Project</th>
                        <th>Created By</th>
                        <th>Assigned To</th>
                        <th>Created At</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map(task => (
                        <tr key={task.id}>
                            <td>{task.title}</td>
                            <td>{task.description}</td>
                            <td>
                                <span 
                                    className="priority-badge"
                                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                                >
                                    {task.priority}
                                </span>
                            </td>
                            <td>
                                <span 
                                    className="status-badge"
                                    style={{ backgroundColor: getStatusColor(task.status) }}
                                >
                                    {task.status}
                                </span>
                            </td>
                            <td>{task.project?.name}</td>
                            <td>{task.createdBy?.username}</td>
                            <td>{task.assignedTo?.username || 'Unassigned'}</td>
                            <td>{new Date(task.createdAt).toLocaleDateString()}</td>
                            <td>
                                <div className="action-buttons">
                                    <button 
                                        onClick={() => handleViewLogs(task)}
                                        className="view-logs-btn"
                                    >
                                        View Logs
                                    </button>
                                    {userRole === "ADMIN" && task.status === 'UNASSIGNED' && (
                                        <div className="admin-actions">
                                            <select 
                                                onChange={(e) => onAssignClick && onAssignClick(task.id, e.target.value)}
                                                defaultValue=""
                                                className="assign-select"
                                            >
                                                <option value="">Assign to...</option>
                                                {testers.map(tester => (
                                                    <option key={tester.id} value={tester.id}>
                                                        {tester.username}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    {userRole === "TESTER" && task.status === 'ASSIGNED' && (
                                        <div className="tester-actions">
                                            <button 
                                                onClick={() => handleTesterAction(task, 'close')}
                                                className="close-btn"
                                            >
                                                Close
                                            </button>
                                            <button 
                                                onClick={() => onNavigateToCreateBug && onNavigateToCreateBug()}
                                                className="report-bug-btn"
                                            >
                                                Report Bug
                                            </button>
                                        </div>
                                    )}
                                    {userRole === "TESTER" && task.status === 'CLOSED' && (
                                        <div className="tester-actions">
                                            <span className="task-closed-label">Task Closed</span>
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Timeline Modal */}
            {timelineModal.open && ReactDOM.createPortal(
                <div className="modal-overlay" onClick={() => setTimelineModal(prev => ({ ...prev, open: false }))}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Task Timeline - {timelineModal.taskTitle}</h3>
                            <button 
                                className="close-button"
                                onClick={() => setTimelineModal(prev => ({ ...prev, open: false }))}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            {timelineModal.loading ? (
                                <p>Loading logs...</p>
                            ) : (
                                <ul className={timelineModal.logs.length === 1 ? 'single-log' : ''}>
                                    {timelineModal.logs.map(log => (
                                        <li key={log.id} className="log-entry">
                                            <div className="log-header">
                                                <span className="log-user">{log.user.username}</span>
                                                <span className="log-status">{log.status}</span>
                                                <span className="log-time">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="log-content">
                                                <p className="log-text">{log.text}</p>
                                                {log.hasImage && (
                                                    <div className="log-image">
                                                        <img
                                                            src={`http://localhost:8080/api/tasks/logs/${log.id}/image`}
                                                            alt="Log attachment"
                                                            onClick={() => handleImageClick(
                                                                `http://localhost:8080/api/tasks/logs/${log.id}/image`,
                                                                'Log Image'
                                                            )}
                                                            style={{ cursor: 'pointer', maxWidth: '100px', maxHeight: '100px' }}
                                                        />
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

            {/* Image Modal */}
            {imageModal.open && ReactDOM.createPortal(
                <div className="modal-overlay" onClick={() => setImageModal({ open: false, imageUrl: '', title: '' })}>
                    <div className="image-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="image-modal-header">
                            <h3>{imageModal.title}</h3>
                            <button 
                                className="close-button"
                                onClick={() => setImageModal({ open: false, imageUrl: '', title: '' })}
                            >
                                ×
                            </button>
                        </div>
                        <div className="image-modal-body">
                            <img src={imageModal.imageUrl} alt={imageModal.title} />
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Tester Action Modal */}
            {testerActionModal.open && ReactDOM.createPortal(
                <div className="modal-overlay" onClick={() => setTesterActionModal({ open: false, task: null, action: '', comment: '', image: null })}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{testerActionModal.action === 'close' ? 'Close Task' : 'Task Action'}</h3>
                            <button 
                                className="close-button"
                                onClick={() => setTesterActionModal({ open: false, task: null, action: '', comment: '', image: null })}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Comment:</label>
                                <textarea
                                    value={testerActionModal.comment}
                                    onChange={(e) => setTesterActionModal(prev => ({ ...prev, comment: e.target.value }))}
                                    placeholder="Enter your comment..."
                                    rows="3"
                                />
                            </div>
                            <div className="form-group">
                                <label>Image (Optional):</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setTesterActionModal(prev => ({ ...prev, image: e.target.files[0] }))}
                                />
                            </div>
                            <div className="modal-actions">
                                <button 
                                    onClick={handleTesterModalSubmit}
                                    className="submit-btn"
                                >
                                    {testerActionModal.action === 'close' ? 'Close Task' : 'Submit'}
                                </button>
                                <button 
                                    onClick={() => setTesterActionModal({ open: false, task: null, action: '', comment: '', image: null })}
                                    className="cancel-btn"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default TaskTable; 