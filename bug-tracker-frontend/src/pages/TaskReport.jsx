import React, { useEffect, useState } from 'react';
import TaskTable from '../components/TaskTable';
import axios from '../services/api';
import '../Styles/TaskReport.css';

const TaskReport = (props) => {
  const [tasks, setTasks] = useState([]);
  const [testers, setTesters] = useState([]);
  const [titleFilter, setTitleFilter] = useState('');
  const [userRole, setUserRole] = useState('ADMIN');
  const [currentUsername, setCurrentUsername] = useState('');
  const [timeFilters, setTimeFilters] = useState({
    UNASSIGNED: '1_DAY',
    ASSIGNED: '1_DAY',
    CLOSED: '1_DAY',
  });

  const [expandedSections, setExpandedSections] = useState({
    UNASSIGNED: true,
    ASSIGNED: true,
    CLOSED: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const username = localStorage.getItem("username");

      setUserRole(role);
      setCurrentUsername(username);

      try {
        let taskRes;
        if (role === "DEVELOPER") {
          taskRes = await axios.get("/tasks/created", {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else if (role === "TESTER") {
          taskRes = await axios.get("/tasks/assigned", {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          taskRes = await axios.get("/tasks", {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        
        setTasks(props.tasksOverride || taskRes.data);

        if (role === "ADMIN") {
          const testerRes = await axios.get("auth/users?role=TESTER", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setTesters(testerRes.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [props.tasksOverride]);

  const refreshTasks = async () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    try {
      let taskRes;
      if (role === "DEVELOPER") {
        taskRes = await axios.get("/tasks/created", {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (role === "TESTER") {
        taskRes = await axios.get("/tasks/assigned", {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        taskRes = await axios.get("/tasks", {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      
      setTasks(props.tasksOverride || taskRes.data);
    } catch (error) {
      console.error("Error refreshing tasks:", error);
    }
  };

  const handleAssignClick = async (taskId, testerId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(`/tasks/${taskId}/assign/${testerId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Task assigned!");

      const res = await axios.get("/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data);
    } catch (error) {
      alert("Assignment failed");
    }
  };

  const getPriorityRank = (priority) => {
    switch (priority?.toUpperCase()) {
      case "CRITICAL": return 1;
      case "HIGH": return 2;
      case "MEDIUM": return 3;
      case "LOW": return 4;
      default: return 5;
    }
  };

  const groupTasksByStatus = () => {
    let visibleTasks = tasks;

    if (userRole === "DEVELOPER") {
      visibleTasks = tasks.filter(task => task.createdBy?.username === currentUsername);
    } else if (userRole === "TESTER") {
      visibleTasks = tasks.filter(task => task.assignedTo?.username === currentUsername);
    }

    const filtered = visibleTasks
      .filter(t => t && typeof t.title === 'string' && t.title.toLowerCase().includes(titleFilter.toLowerCase()))
      .sort((a, b) => {
        const priorityDiff = getPriorityRank(a.priority) - getPriorityRank(b.priority);
        return priorityDiff !== 0 ? priorityDiff : a.id - b.id;
      });

    const grouped = {
      UNASSIGNED: [],
      ASSIGNED: [],
      CLOSED: [],
    };

    filtered.forEach(task => {
      const status = task.status?.toUpperCase() || 'UNASSIGNED';
      if (grouped[status]) {
        grouped[status].push(task);
      }
    });

    return grouped;
  };

  const filterByTime = (tasks, status) => {
    const filter = timeFilters[status];
    if (filter === "ALL") return tasks;

    const now = new Date();
    const cutoff = new Date(
      now.getTime() - (filter === "1_DAY" ? 1 : 7) * 24 * 60 * 60 * 1000
    );

    return tasks.filter(task => new Date(task.createdAt) >= cutoff);
  };

  const toggleSection = (status) => {
    setExpandedSections(prev => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const renderSection = (statusLabel, tasks) => {
    const filteredTasks = filterByTime(tasks, statusLabel);
    const isOpen = expandedSections[statusLabel];

    return (
      <div key={statusLabel} className="task-list collapsible-section">
        <div className="collapsible-header" onClick={() => toggleSection(statusLabel)}>
          <h3>{statusLabel.replace('_', ' ')}</h3>
          <button className="collapse-button">
            {isOpen ? '▼' : '▶'}
          </button>
        </div>

        {isOpen && (
          <>
            <select
              value={timeFilters[statusLabel]}
              onChange={(e) =>
                setTimeFilters({ ...timeFilters, [statusLabel]: e.target.value })
              }
              className="dropdown"
            >
              <option value="ALL">All</option>
              <option value="1_DAY">Last 1 Day</option>
              <option value="7_DAY">Last 7 Days</option>
            </select>

            {filteredTasks.length > 0 ? (
              <TaskTable
                tasks={filteredTasks}
                userRole={userRole}
                onAssignClick={handleAssignClick}
                testers={testers}
                onNavigateToCreateBug={props.onNavigateToCreateBug}
                onTaskUpdated={refreshTasks}
              />
            ) : (
              <p className="no-tasks-message">No tasks found for selected time range.</p>
            )}
          </>
        )}
      </div>
    );
  };

  const groupedTasks = groupTasksByStatus();

  return (
    <div className="task-report">
      <h2>Task Reports 📋</h2>
      <input
        type="text"
        className="input"
        placeholder="Search by title..."
        value={titleFilter}
        onChange={(e) => setTitleFilter(e.target.value)}
      />

      {['UNASSIGNED', 'ASSIGNED', 'CLOSED'].map(status => {
        if (status === 'UNASSIGNED' && userRole !== 'ADMIN' && userRole !== 'DEVELOPER') {
          return null;
        }
        return renderSection(status, groupedTasks[status]);
      })}
    </div>
  );
};

export default TaskReport; 