import React, { useEffect, useState } from 'react';
import BugTable from '../components/BugTable';
import axios from '../services/api';
import '../Styles/BugReport.css';

const BugReport = (props) => {
  const [bugs, setBugs] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [titleFilter, setTitleFilter] = useState('');
  const [userRole, setUserRole] = useState('ADMIN');
  const [currentUsername, setCurrentUsername] = useState('');
  const [timeFilters, setTimeFilters] = useState({
    UNASSIGNED: '1_DAY',
    ASSIGNED: '1_DAY',
    IN_PROGRESS: '1_DAY',
    RESOLVED: '1_DAY',
  });

  const [expandedSections, setExpandedSections] = useState({
    UNASSIGNED: true,
    ASSIGNED: true,
    IN_PROGRESS: true,
    RESOLVED: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const username = localStorage.getItem("username");

      setUserRole(role);
      setCurrentUsername(username);

      try {
        const bugRes = await axios.get("/bugs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        let bugList;
        if (props.bugsOverride) {
          bugList = props.bugsOverride;
        } else {
          bugList = bugRes.data
            .map(b => b.bug ? { ...b.bug, breached: b.breached } : b)
            .filter(bug => !bug.wasBreached);
        }
        setBugs(bugList);

        if (role === "ADMIN") {
          const devRes = await axios.get("auth/users?role=DEVELOPER", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setDevelopers(devRes.data);
        }
      } catch (error) {
        setBugs([]);
      }
    };
    fetchData();
  }, [props.bugsOverride]);

  // Add auto-refresh for color system (breach stage)
  useEffect(() => {
    const interval = setInterval(() => {
      setBugs(bugs => [...bugs]); // Force re-render to update color
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleAssignClick = async (bugId, developerId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(`/bugs/${bugId}/assign/${developerId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Bug assigned!");

      const res = await axios.get("/bugs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bugList = res.data.map(b => b.bug ? { ...b.bug, breached: b.breached } : b);
      setBugs(bugList);
    } catch (error) {
      alert("Assignment failed");
    }
  };

  const getPriorityRank = (priority) => {
    switch (priority?.toUpperCase()) {
      case "HIGH": return 1;
      case "MEDIUM": return 2;
      case "LOW": return 3;
      default: return 4;
    }
  };

  const groupBugsByStatus = () => {
    let visibleBugs = bugs;

    if (userRole === "DEVELOPER") {
      visibleBugs = bugs.filter(bug => bug.assignedTo?.username === currentUsername);
    } else if (userRole === "TESTER") {
      visibleBugs = bugs.filter(bug => bug.createdBy?.username === currentUsername);
    }

    const filtered = visibleBugs
      .filter(b => b && typeof b.title === 'string' && b.title.toLowerCase().includes(titleFilter.toLowerCase()) && !b.breached) // Filter out breached bugs from regular report
      .sort((a, b) => {
        const priorityDiff = getPriorityRank(a.priority) - getPriorityRank(b.priority);
        return priorityDiff !== 0 ? priorityDiff : a.id - b.id;
      });

    const grouped = {
      UNASSIGNED: [],
      ASSIGNED: [],
      IN_PROGRESS: [],
      RESOLVED: [],
      CLOSED: [],
    };

    filtered.forEach(bug => {
      const status = bug.status?.toUpperCase() || 'UNASSIGNED';
      if (status === 'OPEN' && !bug.assignedTo) {
        grouped.UNASSIGNED.push(bug);
      } else if (grouped[status]) {
        grouped[status].push(bug);
      }
    });

    return grouped;
  };

  const filterByTime = (bugs, status) => {
    const filter = timeFilters[status];
    if (filter === "ALL") return bugs;

    const now = new Date();
    const cutoff = new Date(
      now.getTime() - (filter === "1_DAY" ? 1 : 7) * 24 * 60 * 60 * 1000
    );

    return bugs.filter(bug => new Date(bug.createdAt) >= cutoff);
  };

  const toggleSection = (status) => {
    setExpandedSections(prev => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const renderSection = (statusLabel, bugs) => {
    const filteredBugs = filterByTime(bugs, statusLabel);
    const isOpen = expandedSections[statusLabel];

    return (
      <div key={statusLabel} className="bug-list collapsible-section">
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

            {filteredBugs.length > 0 ? (
              <BugTable
                bugs={filteredBugs}
                userRole={userRole}
                onAssignClick={handleAssignClick}
                developers={developers}
              />
            ) : (
              <p className="no-bugs-message">No bugs found for selected time range.</p>
            )}
          </>
        )}
      </div>
    );
  };

  const groupedBugs = groupBugsByStatus();

  return (
    <div className="bug-report">
      <h2>Bug Reports 🐞</h2>
      <input
        type="text"
        className="input"
        placeholder="Search by title..."
        value={titleFilter}
        onChange={(e) => setTitleFilter(e.target.value)}
      />

      {['UNASSIGNED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(status => {
        if (status === 'UNASSIGNED' && userRole !== 'ADMIN' && userRole !== 'TESTER') {
          return null;
        }
        return renderSection(status, groupedBugs[status]);
      })}
    </div>
  );
};

export default BugReport;
