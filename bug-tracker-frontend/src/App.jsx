import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './Styles/main.css';
import './Styles/Login.css';
import './Styles/Register.css';
import './Styles/ProjectForm.css';
import './Styles/ChangePassword.css';
import './Styles/BugTable.css';
import './Styles/BugForm.css';
import './Styles/ViewDevelopers.css';
import './Styles/ViewTesters.css';
import './Styles/TesterDashboard.css';
import './Styles/DeveloperDashboard.css';
import './Styles/Home.css';
import './Styles/AboutUs.css';

import AdminDashboard from './pages/AdminDashboard';
import TesterDashboard from './pages/TesterDashboard';
import DeveloperDashboard from './pages/DeveloperDashboard';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ProjectForm from './components/ProjectForm';
import BugReport from './pages/BugReport';
import ViewDevelopers from './pages/ViewDevelopers';
import ViewTesters from './pages/ViewTesters';
import ManageProjects from './pages/ManageProjects';
import Navbar from './components/Navbar';
import PrivateRoute from './routes/PrivateRoute';
import Home from "./pages/Home";
import ChangePasswordPage from "./components/ChangePasswordPage";
import AboutUs from "./pages/AboutUs";
import ContactUs from './pages/ContactUs';
import { getUserRole, isAuthenticated } from './services/auth';

function App() {
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const userRole = getUserRole();

  return (
    <Router>
      <Navbar role={userRole} setLoggedIn={setLoggedIn} loggedIn={loggedIn} />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />

        <Route
          path="/login"
          element={
            loggedIn ? (
              <Navigate to={`/${userRole?.toLowerCase()}`} replace />
            ) : (
              <LoginForm setLoggedIn={setLoggedIn} />
            )
          }
        />

        <Route
          path="/change-password"
          element={
            <PrivateRoute role={userRole}>
              <ChangePasswordPage />
            </PrivateRoute>
          }
        />

        {/* Admin-only routes */}
        <Route path="/register" element={<PrivateRoute role="ADMIN"><RegisterForm /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute role="ADMIN"><AdminDashboard /></PrivateRoute>} />
        <Route path="/manageprojects" element={<PrivateRoute role="ADMIN"><ManageProjects /></PrivateRoute>} />
        <Route path="/createproject" element={<PrivateRoute role="ADMIN"><ProjectForm /></PrivateRoute>} />
        <Route path="/bugreport" element={<PrivateRoute role="ADMIN"><BugReport /></PrivateRoute>} />
        <Route path="/viewdevelopers" element={<PrivateRoute role="ADMIN"><ViewDevelopers /></PrivateRoute>} />
        <Route path="/viewtesters" element={<PrivateRoute role="ADMIN"><ViewTesters /></PrivateRoute>} />

        {/* Developer */}
        <Route path="/developer" element={<PrivateRoute role="DEVELOPER"><DeveloperDashboard /></PrivateRoute>} />

        {/* Tester */}
        <Route path="/tester" element={<PrivateRoute role="TESTER"><TesterDashboard /></PrivateRoute>} />
        <Route path="/assignproject" element={<PrivateRoute role="TESTER"><TesterDashboard /></PrivateRoute>} />

        <Route path="*" element={<h2>404 - Page Not Found</h2>} />
      </Routes>
    </Router>
  );
}

export default App;
