// src/pages/AdminEvents.js
import React, { useState, useEffect } from 'react';
import { db } from '../config/FirebaseConfig';
import { collection, addDoc, getDocs, doc, setDoc } from 'firebase/firestore';
import {
  Card, Row, Col, Tag, Avatar, Modal, Button,
  Input, TimePicker, message, Form
} from 'antd';
import dayjs from 'dayjs';
import CustomCalendar from '../customs/CustomCalendar'; // Your calendar component

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  const fetchEvents = async () => {
    const snapshot = await getDocs(collection(db, 'events'));
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setEvents(list);
  };

  useEffect(() => { fetchEvents(); }, []);

const handleSubmit = async () => {
  if (!title || !date || !startTime || !endTime) {
    return message.error('Please fill in all fields.');
  }

  try {
    const docRef = await addDoc(collection(db, 'events'), {
      title,
      date: dayjs(date).format('YYYY-MM-DD'),
      startTime: dayjs(startTime).format('HH:mm'),
      endTime: dayjs(endTime).format('HH:mm'),
    });

    // 🟢 Add a default form template under /events/{eventId}/form/template
    const defaultForm = {
      questions: [
        { type: 'text', label: 'Full Name', required: true },
        { type: 'email', label: 'Email', required: true },
        { type: 'text', label: 'Year', required: true },
        { type: 'text', label: 'Section (Format: INF###)', required: true },
        { type: 'checkbox', label: 'Photo Consent' },
        { type: 'checkbox', label: 'Video Consent' },
        { type: 'checkbox', label: 'Agree to Data Privacy Policy', required: true }
      ]
    };

    await setDoc(doc(db, 'events', docRef.id, 'form', 'template'), defaultForm);

    message.success('Event and form template created!');
    setModalOpen(false);
    setTitle('');
    setDate(null);
    setStartTime(null);
    setEndTime(null);
    fetchEvents();
  } catch (err) {
    console.error(err);
    message.error('Failed to add event and form.');
  }
};

  return (
    <div style={{ padding: '0 24px' }}>
      <Button type="primary" onClick={() => setModalOpen(true)} style={{ marginBottom: 24 }}>
        Add New Event
      </Button>

      <Modal
        title="Add New Event"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Add Event"
        cancelText="Cancel"
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="Event Title" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Form.Item>
          <Form.Item label="Date" required>
            <CustomCalendar date={date} setDate={setDate} />
          </Form.Item>
          <Form.Item label="Start Time" required>
            <TimePicker style={{ width: '100%' }} value={startTime} onChange={setStartTime} format="HH:mm" minuteStep={5} />
          </Form.Item>
          <Form.Item label="End Time" required>
            <TimePicker style={{ width: '100%' }} value={endTime} onChange={setEndTime} format="HH:mm" minuteStep={5} />
          </Form.Item>
        </Form>
      </Modal>

      <h3>Upcoming Events</h3>
      <Row gutter={[16, 16]}>
        {events.map(event => (
          <Col xs={24} sm={24} md={12} lg={12} key={event.id}>
            <Card bordered={false}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Avatar shape="square" size="large" style={{ backgroundColor: '#f5a623' }}>
                  {event.title.slice(0, 2).toUpperCase()}
                </Avatar>
                <div style={{ marginLeft: 12 }}>
                  <h3>{event.title}</h3>
                  <p>Room: TBD</p>
                </div>
                <Tag color="red">Date: {event.date}</Tag>
              </div>
              <p><strong>Time:</strong> {event.startTime} – {event.endTime}</p>
              <p>
                <Button size="small" href={`/form/${event.id}`} target="_blank">Copy Link</Button>
              </p>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default AdminEvents;
