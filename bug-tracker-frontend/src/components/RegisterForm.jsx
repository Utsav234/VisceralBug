import axios from '../services/api';
import "../Styles/Register.css"

import { useState } from 'react';

const passwordRules = [
  {
    label: 'At least 8 characters',
    test: (pw) => pw.length >= 8
  },
  {
    label: 'First letter is capital',
    test: (pw) => /^[A-Z]/.test(pw)
  },
  {
    label: 'At least one number',
    test: (pw) => /[0-9]/.test(pw)
  },
  {
    label: 'At least one special character (@ or #)',
    test: (pw) => /[@#]/.test(pw)
  }
];

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'developer'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'warning'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isPasswordValid) {
      newErrors.password = 'Password does not meet all requirements';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const isPasswordValid = passwordRules.every(rule => rule.test(formData.password));

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!validateForm()) {
      showMessage('Please fix the errors in the form', 'error');
      return;
    }
    
    setIsSubmitting(true);
    setMessage('');
    
    try {
      await axios.post("/auth/register", formData);
      showMessage('User registered successfully! 🎉', 'success');
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'developer'
      });
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err.response) {
        const errorMessage = err.response.data;
        if (errorMessage.includes('Username already taken')) {
          showMessage('❌ Username is already taken. Please choose a different username.', 'error');
        } else if (errorMessage.includes('Email already registered')) {
          showMessage('❌ Email is already registered. Please use a different email.', 'error');
        } else if (errorMessage.includes('Only the initial admin')) {
          showMessage('❌ Only the initial admin can create other admin accounts.', 'error');
        } else {
          showMessage(`❌ Registration failed: ${errorMessage}`, 'error');
        }
      } else if (err.request) {
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
    <form onSubmit={handleSubmit} className="register-form">
      <h2>Register User</h2>
      
      <div className="form-group">
        <input 
          name="username" 
          value={formData.username} 
          onChange={handleChange} 
          placeholder="Name" 
          className={errors.username ? 'error-input' : ''}
        />
        {errors.username && <span className="error-text">{errors.username}</span>}
      </div>
      
      <div className="form-group">
        <input 
          name="email" 
          value={formData.email} 
          onChange={handleChange} 
          placeholder="Email" 
          className={errors.email ? 'error-input' : ''}
        />
        {errors.email && <span className="error-text">{errors.email}</span>}
      </div>

      <div className="form-group">
        <div style={{ position: 'relative' }}>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className={errors.password ? 'error-input' : ''}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '8px',
              cursor: 'pointer'
            }}
          >
            {showPassword ? '🙈' : '👁️'}
          </span>
        </div>
        {errors.password && <span className="error-text">{errors.password}</span>}
      </div>

      {/* Password Rules Box */}
      <div className="password-rules-box">
        <strong>Password must contain:</strong>
        <ul>
          {passwordRules.map((rule, idx) => (
            <li key={idx} style={{ color: rule.test(formData.password) ? '#27ae60' : '#e74c3c', fontWeight: rule.test(formData.password) ? 600 : 400 }}>
              {rule.test(formData.password) ? '✅' : '❌'} {rule.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="form-group">
        <select name="role" value={formData.role} onChange={handleChange}>
          <option value="developer">Developer</option>
          <option value="tester">Tester</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <button 
        type="submit" 
        disabled={!isPasswordValid || isSubmitting}
        className={isSubmitting ? 'submitting' : ''}
      >
        {isSubmitting ? 'Registering...' : 'Register'}
      </button>
      
      {message && (
        <div className="message-box" style={getMessageStyle()}>
          {message}
        </div>
      )}
    </form>
  );
};

export default RegisterForm;