// src/pages/Form.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../config/FirebaseConfig';
import { collection, doc, getDoc, addDoc } from 'firebase/firestore';
import '../styles/RegistrationForm.css';
import dayjs from 'dayjs';

const RegistrationForm = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [isClosed, setIsClosed] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', email: '', year: '', section: '',
    photoConsent: false, videoConsent: false, dataPrivacyAgreement: false
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      const docRef = doc(db, 'events', eventId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const eventData = snap.data();
        setEvent(eventData);

        // Check form deadline
        if (eventData.formDeadline && dayjs().isAfter(dayjs(eventData.formDeadline))) {
          setIsClosed(true);
        }
      }
    };
    loadEvent();
  }, [eventId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dataPrivacyAgreement) {
      alert("You must accept the data privacy terms.");
      return;
    }
    await addDoc(collection(db, 'registrations'), {
      ...formData,
      eventId,
      submittedAt: new Date()
    });
    setSubmitted(true);
  };

  if (!event) return <p>Loading event...</p>;
  if (isClosed) return <h2>Registration for {event.title} is now closed.</h2>;
  if (submitted) return <h2>Thanks for registering for {event.title}!</h2>;

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2>Register for {event.title}</h2>

      <div className="event-info-box">
        <p><strong>Event Title:</strong> {event.title}</p>
        <p><strong>Date:</strong> {event.date}</p>
        <p><strong>Time:</strong> {event.startTime} – {event.endTime}</p>
      </div>

      <label>Full Name:</label>
      <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />

      <label>Email:</label>
      <input type="email" name="email" value={formData.email} onChange={handleChange} required />

      <label>Year:</label>
      <input type="text" name="year" value={formData.year} onChange={handleChange} required />

      <label>Section (INF###):</label>
      <input type="text" name="section" value={formData.section} onChange={handleChange} required />

      <div className="checkbox-block">
        <label>
          <input type="checkbox" name="photoConsent" checked={formData.photoConsent} onChange={handleChange} />
          Photo consent
        </label>
        <label>
          <input type="checkbox" name="videoConsent" checked={formData.videoConsent} onChange={handleChange} />
          Video consent
        </label>
        <label>
          <input type="checkbox" name="dataPrivacyAgreement" checked={formData.dataPrivacyAgreement} onChange={handleChange} required />
          I agree to data privacy
        </label>
      </div>

      <button type="submit">Submit</button>
    </form>
  );
};

export default RegistrationForm;
