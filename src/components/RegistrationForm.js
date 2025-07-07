import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../config/FirebaseConfig';
import { collection, doc, getDoc, addDoc } from 'firebase/firestore';
import '../styles/RegistrationForm.css';
import dayjs from 'dayjs';

const RegistrationForm = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [customQuestions, setCustomQuestions] = useState([]);
  const [isClosed, setIsClosed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState('privacy'); // new step control

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    year: '',
    section: '',
    photoConsent: false,
    videoConsent: false,
    dataPrivacyAgreement: false,
    customAnswers: {}
  });

  useEffect(() => {
    const loadEvent = async () => {
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);

      const formTemplateRef = doc(db, 'events', eventId, 'form', 'template');
      const formSnap = await getDoc(formTemplateRef);

      if (eventSnap.exists()) {
        const eventData = eventSnap.data();
        setEvent(eventData);

        if (formSnap.exists()) {
          const formTemp = formSnap.data();
          setCustomQuestions(formTemp.customQuestions || []);
        }

        if (eventData.formDeadline && dayjs().isAfter(dayjs(eventData.formDeadline))) {
          setIsClosed(true);
        }
      }
    };

    loadEvent();
  }, [eventId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('custom_')) {
      const questionKey = name.replace('custom_', '');
      setFormData(prev => ({
        ...prev,
        customAnswers: {
          ...prev.customAnswers,
          [questionKey]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const sectionPattern = /^INF\d{3}$/i;
    if (!sectionPattern.test(formData.section.trim())) {
      alert("Section must be in the format INF### (e.g., INF123)");
      return;
    }

    if (!formData.dataPrivacyAgreement) {
      alert("You must accept the data privacy terms.");
      return;
    }

    const docRef = await addDoc(
      collection(db, 'events', eventId, 'registrations'),
      {
        ...formData,
        submittedAt: new Date()
      }
    );

    await fetch('http://localhost:3001/send-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        fullName: formData.fullName,
        eventTitle: event.title,
        qrData: docRef.id
      })
    });

    setSubmitted(true);
  };

  const renderPrivacyPage = () => (
    <div className="form-container">
      <h2>Data Privacy Agreement</h2>
      <div className="event-info-box">
        <p>
          By proceeding, you agree that your submitted personal data will be used solely for this event's
          registration, attendance, and communication purposes in compliance with the Data Privacy Act of 2012.
        </p>
        <p>
          Your data will be handled securely and will not be shared with unauthorized third parties.
        </p>

        <label className="privacy-checkbox">
          <input
            type="checkbox"
            checked={formData.dataPrivacyAgreement}
            onChange={(e) => {
              const checked = e.target.checked;
              setFormData(prev => ({ ...prev, dataPrivacyAgreement: checked }));
            }}
          />
          I agree to the data privacy terms
        </label>

        <button
          className="submit-btn"
          disabled={!formData.dataPrivacyAgreement}
          onClick={() => setStep('form')}
        >
          Continue to Registration
        </button>
      </div>
    </div>
  );

  if (!event) return <p>Loading event...</p>;
  if (isClosed) return <h2>Registration for {event.title} is now closed.</h2>;
  if (submitted) return <h2>Thanks for registering for {event.title}!</h2>;
  if (step === 'privacy') return renderPrivacyPage();

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2>Register for {event.title}</h2>

      <div className="event-info-box">
        <p><strong>Event Title:</strong> {event.title}</p>
        <p><strong>Date:</strong> {event.date}</p>
        <p><strong>Time:</strong> {event.startTime} – {event.endTime}</p>
      </div>

      <div className="form-group">
        <label htmlFor="fullName">Full Name <span className="required-asterisk">*</span></label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          className="form-input"
          value={formData.fullName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email <span className="required-asterisk">*</span></label>
        <input
          type="email"
          id="email"
          name="email"
          className="form-input"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="year">Year <span className="required-asterisk">*</span></label>
        <select
          id="year"
          name="year"
          className="form-input"
          value={formData.year}
          onChange={handleChange}
          required
        >
          <option value="">Select your year</option>
          <option value="1st Year">1st Year</option>
          <option value="2nd Year">2nd Year</option>
          <option value="3rd Year">3rd Year</option>
          <option value="4th Year">4th Year</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="section">Section (INF###) <span className="required-asterisk">*</span></label>
        <input
          type="text"
          id="section"
          name="section"
          className="form-input"
          value={formData.section}
          onChange={(e) => {
            const input = e.target.value.toUpperCase();
            if (/^I?$|^IN?$|^INF?$|^INF\d{0,3}$/.test(input)) {
              setFormData(prev => ({ ...prev, section: input }));
            }
          }}
          required
        />
        {formData.section && !/^INF\d{3}$/.test(formData.section) && (
          <p className="error-text">Must follow format: INF123</p>
        )}
      </div>

      {customQuestions.map((q, idx) => {
        const fieldName = `custom_${idx}`;
        const value = formData.customAnswers[idx] || '';
        const isRequired = q.required === true;

        return (
          <div key={idx} className="form-group custom-question">
            <label htmlFor={fieldName}>
              {q.label}{isRequired && <span className="required-asterisk">*</span>}
            </label>
            {q.type === 'checkbox' ? (
              <input
                type="checkbox"
                id={fieldName}
                name={fieldName}
                className="form-checkbox"
                checked={!!value}
                onChange={handleChange}
                required={isRequired}
              />
            ) : (
              <input
                type={q.type || 'text'}
                id={fieldName}
                name={fieldName}
                className="form-input"
                value={value}
                onChange={handleChange}
                required={isRequired}
              />
            )}
          </div>
        );
      })}

      <div className="checkbox-block">
        <label>
          <input
            type="checkbox"
            name="photoConsent"
            className="form-checkbox"
            checked={formData.photoConsent}
            onChange={handleChange}
          />
          Photo consent <span className="required-asterisk">*</span>
        </label>

        <label>
          <input
            type="checkbox"
            name="videoConsent"
            className="form-checkbox"
            checked={formData.videoConsent}
            onChange={handleChange}
          />
          Video consent <span className="required-asterisk">*</span>
        </label>
      </div>

      <button type="submit" className="submit-btn">Submit</button>
    </form>
  );
};

export default RegistrationForm;
