import React, { useState, useEffect } from 'react';
import { db } from '../config/FirebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { Card, Row, Col } from 'antd';
import './styles/Form.css'; // keep your existing styles
import './styles/AdminEvents.css'; // optional for card custom styling

const AdminEvents = () => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [events, setEvents] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !date || !time) return alert('Please fill all fields.');

    try {
      await addDoc(collection(db, 'events'), { title, date, time });
      alert('Event added successfully!');
      setTitle('');
      setDate('');
      setTime('');
      fetchEvents(); // Refresh list
    } catch (err) {
      console.error('Error adding event:', err);
    }
  };

  const fetchEvents = async () => {
    const snapshot = await getDocs(collection(db, 'events'));
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setEvents(list);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="form-container">
      <h2>Add New Event</h2>
      <form onSubmit={handleSubmit}>
        <label>Event Title:</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />

        <label>Date:</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <label>Time:</label>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />

        <button type="submit">Add Event</button>
      </form>

      <h3>Upcoming Events</h3>
      <Row gutter={[16, 16]}>
        {events.map(event => (
          <Col xs={24} sm={12} md={8} lg={6} key={event.id}>
            <Card
              title={event.title}
              bordered={false}
              className="event-card"
            >
              <p><strong>Date:</strong> {event.date}</p>
              <p><strong>Time:</strong> {event.time}</p>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default AdminEvents;
