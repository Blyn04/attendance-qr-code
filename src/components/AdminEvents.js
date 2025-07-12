import React, { useState, useEffect } from 'react';
import { db } from '../config/FirebaseConfig';
import { collection, addDoc, getDocs, doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import {
  Card, Row, Col, Tag, Avatar, Modal, Button, Progress,
  Input, TimePicker, message, Form, Tabs, DatePicker,
  Select,
} from 'antd';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import dayjs from 'dayjs';
import QRCode from "react-qr-code";
import '../styles/AdminEvents.css';

const { Option } = Select

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
  const [searchText1, setSearchText1] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [selectedRegistrant, setSelectedRegistrant] = useState(null);
  const [showRegistrantModal, setShowRegistrantModal] = useState(false);
  const [selectedYearFilter, setSelectedYearFilter] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingRegistrant, setDeletingRegistrant] = useState(null);
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
    // const regList = regSnapshot.docs.map(doc => doc.data());
    const regList = regSnapshot.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
    setRegistrations(regList);
  };

  const getAnalytics = () => {
    const yearCounts = {};
    const sectionCounts = {};

    registrations.forEach((reg) => {
      const year = reg.year?.trim() || 'Unknown';
      const section = reg.section?.trim() || 'Unknown';

      yearCounts[year] = (yearCounts[year] || 0) + 1;
      sectionCounts[section] = (sectionCounts[section] || 0) + 1;
    });

    return { yearCounts, sectionCounts };
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F', '#FFBB28'];

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
            // {
            //   key: '1',
            //   label: 'Details',
            //   children: (
            //     <div>
            //       <p><strong>Room:</strong> {selectedEvent?.room || 'TBD'}</p>
            //       <p><strong>Date:</strong> {selectedEvent?.date}</p>
            //       <p><strong>Time:</strong> {selectedEvent?.startTime} - {selectedEvent?.endTime}</p>
            //       {selectedEvent?.formDeadline && (
            //         <p><strong>Form Closes:</strong> {dayjs(selectedEvent.formDeadline).format('YYYY-MM-DD HH:mm')}</p>
            //       )}
            //     </div>
            //   ),
            // },
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

                  <div style={{ marginTop: 20 }}>
                    <h4>📱 Registration Form QR Code</h4>
                    <QRCode
                      value={`${window.location.origin}/form/${selectedEvent?.id}`}
                      size={128}
                    />
                    <p style={{ marginTop: 8 }}>
                      <a
                        href={`/form/${selectedEvent?.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open Registration Link
                      </a>
                    </p>
                  </div>
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
                    <>
                    <div className="registration-filters">
                      <Input.Search
                        placeholder="Search by name or email"
                        allowClear
                        onChange={(e) => setSearchText1(e.target.value)}
                        className="ant-input-search"
                        style={{ maxWidth: 300 }}
                      />

                      <Select
                        value={selectedYearFilter}
                        onChange={(value) => setSelectedYearFilter(value)}
                        style={{ width: 150 }}
                        placeholder="Filter by Year"
                        allowClear
                      >
                        {[...new Set(registrations.map((r) => r.year?.trim()).filter(Boolean))].map((year, idx) => (
                          <Option key={idx} value={year}>{year}</Option>
                        ))}
                      </Select>

                      <Select
                        value={selectedSectionFilter}
                        onChange={(value) => setSelectedSectionFilter(value)}
                        style={{ width: 180 }}
                        placeholder="Filter by Section"
                        allowClear
                      >
                        {[...new Set(registrations.map((r) => r.section?.trim()).filter(Boolean))].map((section, idx) => (
                          <Option key={idx} value={section}>{section}</Option>
                        ))}
                      </Select>
                    </div>
                      <ul className="registration-list">
                        {registrations
                          .filter(reg =>
                            (reg.fullName?.toLowerCase().includes(searchText1.toLowerCase()) ||
                            reg.email?.toLowerCase().includes(searchText1.toLowerCase())) &&
                            (!selectedYearFilter || reg.year?.trim() === selectedYearFilter) &&
                            (!selectedSectionFilter || reg.section?.trim() === selectedSectionFilter)
                          )
                          .map((reg, idx) => (
                            <li key={idx} className="registration-item">
                              <div onClick={() => {
                                setSelectedRegistrant(reg);
                                setShowRegistrantModal(true);
                              }} style={{ cursor: 'pointer', flex: 1 }}>
                                <strong>{reg.fullName}</strong><br />
                                <small>{reg.email}</small>
                              </div>

                              <Button
                                danger
                                size="small"
                                style={{ marginLeft: 12 }}
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent modal open
                                  setDeletingRegistrant(reg);
                                  setShowDeleteConfirm(true);
                                }}
                              >
                                Delete
                              </Button>
                            </li>
                          ))}
                      </ul>
                    </>
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
              children: (() => {
                const { yearCounts, sectionCounts } = getAnalytics();

                const yearData = Object.entries(yearCounts).map(([key, value]) => ({
                  name: key,
                  value,
                }));

                const sectionData = Object.entries(sectionCounts).map(([key, value]) => ({
                  name: key,
                  value,
                }));

                const total = registrations.length || 1;

                return (
                  <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                    <h4>📚 Registrations by Section (Pie Chart)</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={sectionData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label
                        >
                          {sectionData.map((_, index) => (
                            <Cell key={`section-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>

                    <h4 style={{ marginTop: 32 }}>📈 Registrations by Year (Progress)</h4>
                    {yearData.map((item, index) => (
                      <div key={`year-${item.name}`} style={{ marginBottom: 10 }}>
                        <strong>{item.name}</strong>
                        <Progress
                          percent={((item.value / total) * 100).toFixed(1)}
                          strokeColor={COLORS[index % COLORS.length]}
                          format={percent => `${percent}%`}
                        />
                      </div>
                    ))}
                  </div>
                );
              })(),
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

      <Modal
        open={showRegistrantModal}
        onCancel={() => {
          setShowRegistrantModal(false);
          setSelectedRegistrant(null);
        }}
        footer={null}
        title={selectedRegistrant?.fullName || "Registrant Details"}
        width={600}
      >
        {selectedRegistrant ? (
          <div>
            {(() => {
              const defaultKeys = [
                'fullName',
                'email',
                'year',
                'section',
                'photoConsent',
                'videoConsent',
                'agreeToDataPrivacyPolicy',
              ];

              const defaultFields = [];
              const customFields = [];

              Object.entries(selectedRegistrant).forEach(([key, value]) => {
                let displayValue;

                if (typeof value === 'boolean') {
                  displayValue = value ? '✔️ Yes' : '❌ No';

                } else if (Array.isArray(value)) {
                  displayValue = value.join(', ');

                } else if (typeof value === 'object' && value !== null) {
                  // Handle Firestore Timestamps
                  if ('seconds' in value && 'nanoseconds' in value) {
                    displayValue = new Date(value.seconds * 1000).toLocaleString();

                  } else {
                    // Safely stringify other objects
                    displayValue = JSON.stringify(value, null, 2);
                  }

                } else {
                  displayValue = value;
                }

                const formattedKey = key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase());

                const item = (
                  <div key={key} style={{ marginBottom: 10 }}>
                    <strong>{formattedKey}:</strong> {displayValue}
                  </div>
                );

                if (defaultKeys.includes(key)) {
                  defaultFields.push(item);

                } else {
                  customFields.push(item);
                }
              });

              return (
                <>
                  <h4>📝 Basic Details</h4>
                  {defaultFields}

                  {customFields.length > 0 && (
                    <>
                      <h4 style={{ marginTop: 20 }}>🧩 Custom Questions</h4>
                      {customFields}
                    </>
                  )}
                </>
              );
            })()}
          </div>
        ) : (
          <p>No data found.</p>
        )}
      </Modal>

      <Modal
        open={showDeleteConfirm}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletingRegistrant(null);
        }}
        onOk={async () => {
          try {
            if (!selectedEvent || !deletingRegistrant?.firestoreId) return;

            const regRef = doc(db, 'events', selectedEvent.id, 'registrations', deletingRegistrant.firestoreId);
            await deleteDoc(regRef);

            message.success('Registrant deleted');
            setRegistrations(prev => prev.filter(r => r.firestoreId !== deletingRegistrant.firestoreId));

          } catch (err) {
            console.error(err);
            message.error('Failed to delete registrant.');

          } finally {
            setShowDeleteConfirm(false);
            setDeletingRegistrant(null);
          }
        }}
        okText="Delete"
        okType="danger"
        cancelText="Cancel"
        title={`Confirm Deletion`}
      >
        <p>Are you sure you want to delete the registration for <strong>{deletingRegistrant?.fullName}</strong>?</p>
      </Modal>

    </div>
  );
};

export default AdminEvents;
