import React, { useState } from 'react';
import '../styles/Form.css';

function Form() {
  const [hasAgreed, setHasAgreed] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    year: '',
    section: '',
    photoConsent: false,
    videoConsent: false,
    dataPrivacyAgreement: false,
  });

  const [errors, setErrors] = useState({});

  const handleAgreement = () => {
    setHasAgreed(true);
  };

  const validate = () => {
    const newErrors = {};
    const sectionPattern = /^INF\d{3}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    }

    if (!formData.email.trim() || !emailPattern.test(formData.email)) {
      newErrors.email = 'Valid email is required.';
    }

    if (!formData.year.trim()) {
      newErrors.year = 'Year is required.';
    }

    if (!formData.section.match(sectionPattern)) {
      newErrors.section = 'Section must follow the INF### format (e.g., INF101).';
    }

    if (!formData.dataPrivacyAgreement) {
      newErrors.dataPrivacyAgreement = 'You must agree to the data privacy terms.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log('Form submitted:', formData);
      alert('Form submitted successfully!');
      // Reset or send to server here if needed
    }
  };

  if (!hasAgreed) {
    return (
      <div className="form-container">
        <h2>Data Privacy Agreement</h2>
        <p>Please read and accept our data privacy policy to continue to the form.</p>
        <label className="checkbox-block">
          <input type="checkbox" onChange={handleAgreement} />
          I agree to the data privacy policy.
        </label>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2>Consent Form</h2>

      <label>Full Name:</label>
      <input
        type="text"
        name="fullName"
        value={formData.fullName}
        onChange={handleChange}
      />
      {errors.fullName && <p className="error">{errors.fullName}</p>}

      <label>Email:</label>
      <input
        type="text"
        name="email"
        value={formData.email}
        onChange={handleChange}
      />
      {errors.email && <p className="error">{errors.email}</p>}

      <label>Year:</label>
      <input
        type="text"
        name="year"
        value={formData.year}
        onChange={handleChange}
      />
      {errors.year && <p className="error">{errors.year}</p>}

      <label>Section (Format: INF###):</label>
      <input
        type="text"
        name="section"
        value={formData.section}
        onChange={handleChange}
      />
      {errors.section && <p className="error">{errors.section}</p>}

      <div className="checkbox-block">
        <label>
          <input
            type="checkbox"
            name="photoConsent"
            checked={formData.photoConsent}
            onChange={handleChange}
          />
          I give permission to be photographed.
        </label>
      </div>

      <div className="checkbox-block">
        <label>
          <input
            type="checkbox"
            name="videoConsent"
            checked={formData.videoConsent}
            onChange={handleChange}
          />
          I give permission to be recorded on video.
        </label>
      </div>

      <div className="checkbox-block">
        <label>
          <input
            type="checkbox"
            name="dataPrivacyAgreement"
            checked={formData.dataPrivacyAgreement}
            onChange={handleChange}
          />
          I agree to the data privacy policy.
        </label>
        {errors.dataPrivacyAgreement && (
          <p className="error">{errors.dataPrivacyAgreement}</p>
        )}
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}

export default Form;
