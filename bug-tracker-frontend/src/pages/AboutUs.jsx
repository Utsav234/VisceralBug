import React from 'react';
import '../Styles/AboutUs.css';
import { FaGithub } from 'react-icons/fa';

const AboutUs = () => {
  return (
    <div className="about-container">
 
      <section className="personal-info">
        <h2 className="team-title">Our Team</h2>
        <div className="team-grid five-devs">
     
          <div className="profile-section">
            <div className="profile-image">
              <img src="images/utsav.jpg" alt="Utsav Gavli" />
            </div>
            <div className="profile-details">
              <h1>Utsav Gavli</h1>
              <p className="role">Full Stack Developer</p>
              <p className="description">I am a passionate full-stack developer with expertise in building modern web applications. This bug tracking system is one of my projects that demonstrates my skills in both frontend and backend development.</p>
              <div className="social-links">
                <a href="https://github.com/utsav145">Github</a>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="profile-image">
              <img src="images/vaishnavi.jpg" alt="Shriraj Dhuri" />
            </div>
            <div className="profile-details">
              <h1>Vaishnavi Kulkarni</h1>
              <p className="role">Full Stack Developer</p>
              <p className="description">A skilled developer with a strong background in web development and database management. Contributed to the backend architecture and API development of this bug tracking system.</p>
              <div className="social-links">
                <a href="https://github.com/VaishnaviKulkarni2305">Github</a>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="profile-image">
              <img src="images/Rahul.jpg" alt="Nazmin" />
            </div>
            <div className="profile-details">
              <h1>Rahul Patil</h1>
              <p className="role">Full Stack Developer</p>
              <p className="description">Experienced in UI/UX design and frontend development. Played a key role in creating the user interface and ensuring a smooth user experience in this bug tracking system.</p>
              <div className="social-links">
                <a href="https://github.com/RahulPatil-Tech">Github</a>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="profile-image">
              <img src="" alt="Developer 4" />
            </div>
            <div className="profile-details">
              <h1>Pratik Jadhav</h1>
              <p className="role">Full Stack Developer</p>
              <p className="description">A dedicated developer contributing to the VisceralBug platform. (Dummy text)</p>
              <div className="social-links">
                <a href="mailto:dev4@example.com">Github</a>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="profile-image">
              <img src="images/ritik.jpg" alt="Developer 5" />
            </div>
            <div className="profile-details">
              <h1>Ritik Dongre</h1>
              <p className="role">Full Stack Developer</p>
              <p className="description">A dedicated developer contributing to the VisceralBug platform. (Dummy text)</p>
              <div className="social-links">
                <a href="https://github.com/theritikdongre">Github</a>
              </div>
            </div>
          </div>
        </div>
      </section>

    
      <section className="website-info">
        <h2>About VisceralBug</h2>
        <p className="website-description">
          VisceralBug is designed to help teams efficiently manage and track software bugs and tasks throughout the development lifecycle. The system provides different roles with specific functionalities to ensure smooth bug and task management.
        </p>

        <div className="roles-section">
          <h3>System Roles</h3>
          
          <div className="role-card admin">
            <h4>Admin</h4>
            <ul>
              <li>Manage user accounts and permissions</li>
              <li>Create and manage projects</li>
              <li>Assign developers and testers to projects</li>
              <li>Monitor overall system activity</li>
              <li>Generate system-wide reports</li>
            </ul>
          </div>

          <div className="role-card tester">
            <h4>Tester</h4>
            <ul>
              <li>Report new bugs with detailed information</li>
              <li>Track bug status and progress</li>
              <li>Verify bug fixes and updates</li>
              <li>View assigned projects and their bugs</li>
              <li>Communicate with developers about bug details</li>
            </ul>
          </div>

          <div className="role-card developer">
            <h4>Developer</h4>
            <ul>
              <li>View assigned bugs and projects</li>
              <li>Update bug status and progress</li>
              <li>Add comments and updates to bug reports</li>
              <li>Mark bugs as resolved</li>
              <li>Track bug resolution history</li>
            </ul>
          </div>
        </div>

        <div className="features-section">
          <h3>Key Features</h3>
          <ul>
            <li>Real-time bug and task tracking</li>
            <li>Role-based access (Admin, Developer, Tester)</li>
            <li>Project and team management</li>
            <li>Breach detection and notifications</li>
            <li>Email notifications for key actions</li>
            <li>Modern, responsive UI/UX</li>
            <li>Detailed logs and timelines</li>
            <li>Advanced filtering and search</li>
            <li>Task management (developer to tester)</li>
            <li>Consistent, clean reporting</li>
            <li>Secure authentication (JWT)</li>
            <li>File/image uploads for bugs and tasks</li>
            <li>Analytics and reporting</li>
            <li>Customizable priorities and statuses</li>
            <li>Auto-refresh and live updates</li>
            <li>Breached bug isolation</li>
            <li>Highlighting and reassignment logic</li>
            <li>Timeline and log visualizations</li>
            <li>...and more</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default AboutUs; 