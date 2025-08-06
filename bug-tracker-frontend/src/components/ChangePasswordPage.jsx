import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../services/api';
import '../Styles/ChangePassword.css';

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/user/change-password', {
        oldPassword,
        newPassword,
      });
      setMessage(res.data);
    } catch (err) {
      setMessage("Error changing password");
    }
  };

  return (
    <div className="change-password-container">
      <div className="change-password-header">
        <button 
          onClick={() => navigate(-1)} 
          className="back-button"
          aria-label="Go back"
        >
          ← Back
        </button>
      <h2 className="change-password-title">Change Password</h2>
      </div>
      <form onSubmit={handleChangePassword} className="change-password-form">
        
        <div className="form-group password-group">
          <label className="form-label">Old Password:</label>
          <input
            type={showOld ? 'text' : 'password'}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            className="form-input"
          />
          <button
            type="button"
            onClick={() => setShowOld(!showOld)}
            className="password-toggle"
            aria-label="Toggle old password visibility"
          >
            {showOld ? '🙈' : '👁️'}
          </button>
        </div>

        <div className="form-group password-group">
          <label className="form-label">New Password:</label>
          <input
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="form-input"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="password-toggle"
            aria-label="Toggle new password visibility"
          >
            {showNew ? '🙈' : '👁️'}
          </button>
        </div>

        <button type="submit" className="submit-button">Change Password</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default ChangePasswordPage;
