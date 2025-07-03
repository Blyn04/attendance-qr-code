import React, { useState, useEffect } from 'react';
import { db } from '../config/FirebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import {
  Card,
  Row,
  Col,
  Tag,
  Avatar,
  Modal,
  Button,
  Input,
  TimePicker,
  message,
  Form,
} from 'antd';
import dayjs from 'dayjs';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Import calendar styles
import '../styles/Form.css';
import '../styles/AdminEvents.css';
import '../styles/CustomCalendar.css';
import CustomCalendar from '../customs/CustomCalendar';

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

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSubmit = async () => {
    if (!title || !date || !startTime || !endTime) {
      return message.error('Please fill in all fields.');
    }

    const start = dayjs(startTime);
    const end = dayjs(endTime);
    if (start.isAfter(end)) {
      return message.error('Start time must be before end time.');
    }

    try {
      await addDoc(collection(db, 'events'), {
        title,
        date: dayjs(date).format('YYYY-MM-DD'),
        startTime: start.format('HH:mm'),
        endTime: end.format('HH:mm'),
      });

      message.success('Event added successfully!');
      setModalOpen(false);
      setTitle('');
      setDate(null);
      setStartTime(null);
      setEndTime(null);
      fetchEvents();
    } catch (err) {
      console.error('Error adding event:', err);
      message.error('Failed to add event.');
    }
  };

  return (
    <div style={{ padding: '0 24px' }}>
      <div className="form-container">
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
                <TimePicker
                    style={{ width: '100%' }}
                    value={startTime}
                    onChange={(value) => setStartTime(value)}
                    format="HH:mm"
                    minuteStep={5}
                />
            </Form.Item>

            <Form.Item label="End Time" required>
                <TimePicker
                    style={{ width: '100%' }}
                    value={endTime}
                    onChange={(value) => setEndTime(value)}
                    format="HH:mm"
                    minuteStep={5}
                />
            </Form.Item>

          </Form>
        </Modal>
      </div>

      {/* Event Cards */}
      <h3>Upcoming Events</h3>
      <Row gutter={[16, 16]}>
        {events.map(event => (
          <Col xs={24} sm={24} md={12} lg={12} key={event.id}>
            <Card className="styled-event-card" bordered={false}>
              <div className="event-card-header">
                <Avatar shape="square" size="large" style={{ backgroundColor: '#f5a623' }}>
                  {event.title.slice(0, 2).toUpperCase()}
                </Avatar>
                <div className="event-title-meta">
                  <h3>{event.title}</h3>
                  <p className="event-meta">Room: TBD</p>
                </div>
                <Tag color="red" className="date-badge">
                  Required Date: {event.date}
                </Tag>
              </div>
              <div className="event-description">
                <p>
                  <strong>Time:</strong> {event.startTime} – {event.endTime}
                </p>
                <p>Laboratory Orientation or Workshop Description (custom)</p>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default AdminEvents;
