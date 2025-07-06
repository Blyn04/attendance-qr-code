import React, { useState, useEffect } from 'react';
import { db } from '../config/FirebaseConfig';
import { collection, addDoc, getDocs, doc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  Card, Row, Col, Tag, Avatar, Modal, Button,
  Input, TimePicker, message, Form, Tabs, DatePicker,
} from 'antd';
import dayjs from 'dayjs';
import '../styles/AdminEvents.css';

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('');
  const [date, setDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [form] = Form.useForm();

  const fetchEvents = async () => {
    const snapshot = await getDocs(collection(db, 'events'));
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    list.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
    setEvents(list);
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'events'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
      setEvents(list);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async () => {
    if (!title || !room || !date || !startTime || !endTime) {
      return message.error('Please fill in all fields.');
    }
  };

  const handleCardClick = async (event) => {
    setSelectedEvent(event);

    const regSnapshot = await getDocs(collection(db, 'events', event.id, 'registrations'));
    const regList = regSnapshot.docs.map(doc => doc.data());
    setRegistrations(regList);
  };

  return (
    <div className="admin-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 16 }}>
        <Button type="primary" onClick={() => setModalOpen(true)} className="add-event-btn">
          Add New Event
        </Button>

        <Input.Search
          placeholder="Search event title..."
          allowClear
          enterButton
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ maxWidth: 300 }}
        />
      </div>

      <Modal
        title="Add New Event"
        open={modalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        okText="Add Event"
        cancelText="Cancel"
        width={600}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={async (values) => {
            try {
              const docRef = await addDoc(collection(db, 'events'), {
                title: values.title,
                room: values.room,
                date: dayjs(values.date).format('YYYY-MM-DD'),
                startTime: dayjs(values.startTime).format('HH:mm'),
                endTime: dayjs(values.endTime).format('HH:mm'),
                formDeadline: dayjs(values.formDeadline).toISOString(),
              });

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
              form.resetFields();
              fetchEvents();
            } catch (err) {
              console.error(err);
              message.error('Failed to add event and form.');
            }
          }}
        >
          <Form.Item
            label="Event Title"
            name="title"
            rules={[{ required: true, message: 'Please input the event title' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Venue / Room"
            name="room"
            rules={[{ required: true, message: 'Please input the venue or room' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Date"
            name="date"
            rules={[{ required: true, message: 'Please select a date' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            label="Start Time"
            name="startTime"
            rules={[{ required: true, message: 'Please select a start time' }]}
          >
            <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={10} />
          </Form.Item>

          <Form.Item
            label="End Time"
            name="endTime"
            rules={[{ required: true, message: 'Please select an end time' }]}
          >
            <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={10} />
          </Form.Item>

          <Form.Item
            label="Form Closes"
            name="formDeadline"
            rules={[{ required: true, message: 'Please select form closing time' }]}
          >
            <DatePicker
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              minuteStep={10}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={!!selectedEvent}
        title={`Details for ${selectedEvent?.title}`}
        onCancel={() => setSelectedEvent(null)}
        footer={null}
        width={800}
      >
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: '1',
              label: 'Details',
              children: (
                <div>
                  <p><strong>Room:</strong> {selectedEvent?.room || 'TBD'}</p>
                  <p><strong>Date:</strong> {selectedEvent?.date}</p>
                  <p><strong>Time:</strong> {selectedEvent?.startTime} - {selectedEvent?.endTime}</p>
                  {selectedEvent?.formDeadline && (
                    <p><strong>Form Closes:</strong> {dayjs(selectedEvent.formDeadline).format('YYYY-MM-DD HH:mm')}</p>
                  )}
                </div>
              ),
            },
           {
              key: '2',
              label: `Registrations (${registrations.length})`,
              children: (
                <div>
                  {registrations.length === 0 ? (
                    <p>No one has registered yet.</p>
                  ) : (
                    <ul style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {registrations.map((reg, idx) => (
                        <li key={idx}>
                          <strong>{reg.fullName}</strong> ({reg.email})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ),
            },
            {
              key: '3',
              label: 'Attendance',
              children: <div>📌 Attendance tracker goes here</div>,
            },
            {
              key: '4',
              label: 'Analytics',
              children: <div>📊 Analytics will be shown here</div>,
            },
          ]}
        />
      </Modal>

      <h3>Upcoming Events</h3>
      <Row gutter={[16, 16]}>
        {events
          .filter(event =>
            event.title.toLowerCase().includes(searchText.toLowerCase())
          )
          .map(event => (
            <Col xs={24} sm={24} md={12} lg={12} key={event.id}>
              <Card
                className="styled-event-card"
                bordered={false}
                hoverable
                onClick={() => handleCardClick(event)}
              >
                <div className="event-card-header">
                  <Avatar shape="square" size="large" style={{ backgroundColor: '#f5a623' }}>
                    {event.title.slice(0, 2).toUpperCase()}
                  </Avatar>
                  <div className="event-title-meta">
                    <h3>{event.title}</h3>
                    <p className="event-meta"><strong>Room:</strong> {event.room || 'TBD'}</p>
                  </div>
                  <Tag className="date-badge" color="red">Date: {event.date}</Tag>
                </div>
                <div className="event-description">
                  <p><strong>Time:</strong> {event.startTime} – {event.endTime}</p>
                  {event.formDeadline && (
                    <p><strong>Form Closes:</strong> {dayjs(event.formDeadline).format('YYYY-MM-DD HH:mm')}</p>
                  )}
                  <p>
                    <Button
                      size="small"
                      href={`/form/${event.id}`}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Copy Link
                    </Button>
                  </p>
                </div>
              </Card>
            </Col>
          ))}
      </Row>
    </div>
  );
};

export default AdminEvents;
