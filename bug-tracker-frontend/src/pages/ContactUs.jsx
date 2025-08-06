import React, { useState } from 'react';
import '../Styles/ContactUs.css';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log('Form submitted:', formData);
   
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="contact-container">
      <div className="contact-header">
        <h1>Contact Us</h1>
        <p>Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
      </div>

      <div className="contact-content">
        <div className="contact-form-section">
          <h2>Send us a Message</h2>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Your email address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="Message subject"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                placeholder="Your message"
                rows="5"
              />
            </div>

            <button type="submit" className="submit-button">Send Message</button>
          </form>
        </div>

        <div className="contact-info-section">
          <h2>Contact Information</h2>
          <div className="contact-info">
            <div className="info-item">
              <i className="fas fa-map-marker-alt"></i>
              <div>
                <h3>Address</h3>
                <p>CDAC Mumbai</p>
                <p>Kharghar, Navi Mumbai</p>
                <p>Maharashtra, India</p>
              </div>
            </div>

            <div className="info-item">
              <i className="fas fa-envelope"></i>
              <div>
                <h3>Email</h3>
                <p>support@visceralbug.com</p>
              </div>
            </div>

            <div className="info-item">
              <i className="fas fa-phone"></i>
              <div>
                <h3>Phone</h3>
                <p>+91 1234567890</p>
              </div>
            </div>
          </div>

          <div className="team-contact">
            <h2>Our Team</h2>
            <div className="team-members">
              <div className="team-member">
                <h3>Utsav Gavli</h3>
                <p>Full Stack Developer</p>
                <p>Email: gavliutsav@gmail.com</p>
              </div>

              <div className="team-member">
                <h3>Vaishnavi Kulkarni</h3>
                <p>Full Stack Developer</p>
                <p>Email: vaishnavikulkarni1924@gmail.com</p>
              </div>

              <div className="team-member">
                <h3>Pratik Jadhav</h3>
                <p>Full Stack Developer</p>
                <p>Email: dev3@visceralbug.com</p>
              </div>

              <div className="team-member">
                <h3>Rahul Patil</h3>
                <p>Full Stack Developer</p>
                <p>Email: rp3252154@gmail.com</p>
              </div>

              <div className="team-member">
                <h3>Ritik Dongre</h3>
                <p>Full Stack Developer</p>
                <p>Email: theritikdongre@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs; 