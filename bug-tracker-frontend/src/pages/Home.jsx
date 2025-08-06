import React from 'react';
import { Link } from 'react-router-dom';
import '../Styles/Home.css';

// Import images
import bugTrackerIllustration from '../assets/bug-tracker-illustration.svg';
import avatar1 from '../assets/avatar1.svg';
import avatar2 from '../assets/avatar2.svg';
import featureIcon1 from '../assets/feature-icon1.svg';
import featureIcon2 from '../assets/feature-icon2.svg';
import featureIcon3 from '../assets/feature-icon3.svg';
import featureIcon4 from '../assets/feature-icon4.svg';

const Home = () => {
  return (
    <div className="home-container">
      
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="animate-fade-in">
            Welcome to VisceralBug
            <span className="gradient-text"> Pro</span>
          </h1>
          <p className="hero-description animate-slide-up">
            Streamline your bug tracking process with our powerful and intuitive platform.
            Manage, track, and resolve issues efficiently.
          </p>
          <div className="hero-buttons animate-slide-up">
            <Link to="/login" className="cta-button primary">
              Get Started
            </Link>
            <Link to="/about" className="cta-button secondary">
              Learn More
            </Link>
          </div>
        </div>
        <div className="hero-image animate-fade-in">
          <img src={bugTrackerIllustration} alt="Bug Tracking Illustration" />
        </div>
      </section>


      <section className="features-section">
        <h2 className="section-title animate-fade-in">Key Features</h2>
        <div className="features-grid">
          <div className="feature-card animate-slide-up">
            <img src={featureIcon1} alt="Bug & Task Tracking" className="feature-icon" />
            <h3>Bug & Task Tracking</h3>
            <p>Real-time tracking and management of bugs and tasks with detailed reporting and status updates.</p>
          </div>
          <div className="feature-card animate-slide-up">
            <img src={featureIcon2} alt="Team Collaboration" className="feature-icon" />
            <h3>Team Collaboration</h3>
            <p>Work seamlessly with your team members through real-time updates, notifications, and role-based access.</p>
          </div>
          <div className="feature-card animate-slide-up">
            <img src={featureIcon3} alt="Analytics & Breach Detection" className="feature-icon" />
            <h3>Analytics & Breach Detection</h3>
            <p>Get insights into bug patterns, team performance, and receive breach notifications for critical issues.</p>
          </div>
          <div className="feature-card animate-slide-up">
            <img src={featureIcon4} alt="Project & Task Management" className="feature-icon" />
            <h3>Project & Task Management</h3>
            <p>Organize, assign, and prioritize bugs and tasks across multiple projects efficiently.</p>
          </div>
        </div>
      </section>

     
      <section className="how-it-works-section">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Report Bugs</h3>
            <p>Create detailed bug reports with screenshots and descriptions.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Assign & Track</h3>
            <p>Assign bugs to team members and track their progress.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Resolve Issues</h3>
            <p>Work together to resolve bugs and update their status.</p>
          </div>
        </div>
      </section>


      <section className="testimonials-section">
        <h2 className="section-title animate-fade-in">What Our Users Say</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card animate-slide-up">
            <div className="testimonial-content">
              <i className="fas fa-quote-left quote-icon"></i>
              <p>"BugTracker Pro has revolutionized how our team handles bug reports. The interface is intuitive and the features are exactly what we needed."</p>
            </div>
            <div className="testimonial-author">
              <img src={avatar1} alt="Sarah Johnson" />
              <div>
                <h4>Sarah Johnson</h4>
                <p>Lead Developer</p>
              </div>
            </div>
          </div>
          <div className="testimonial-card animate-slide-up">
            <div className="testimonial-content">
              <i className="fas fa-quote-left quote-icon"></i>
              <p>"The analytics features have helped us identify patterns in our bugs and improve our development process significantly."</p>
            </div>
            <div className="testimonial-author">
              <img src={avatar2} alt="Michael Chen" />
              <div>
                <h4>Michael Chen</h4>
                <p>Project Manager</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>About VisceralBug</h3>
            <p>A modern bug and task tracking system designed to help teams efficiently manage and track software bugs and tasks throughout the development lifecycle.</p>
          </div>
          
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li>Home</li>
              <li>About Us</li>
              <li>Features</li>
              <li>Contact</li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Contact Info</h3>
            <ul>
              <li>
                <div className="contact-info">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>Mumbai, Maharashtra</span>
                </div>
              </li>
              <li>
                <div className="contact-info">
                  <i className="fas fa-phone"></i>
                  <span>+91 1234567890</span>
                </div>
              </li>
              <li>
                <div className="contact-info">
                  <i className="fas fa-envelope"></i>
                  <span>info@bugtracker.com</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 VisceralBug. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
