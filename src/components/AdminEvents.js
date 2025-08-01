import React, { useState, useEffect } from 'react';
import { db } from '../config/FirebaseConfig';
import { collection, addDoc, getDocs, doc, setDoc, onSnapshot, deleteDoc, getDoc } from 'firebase/firestore';
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
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [selectedYearFilter, setSelectedYearFilter] = useState(null);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingRegistrant, setDeletingRegistrant] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedAttendee, setSelectedAttendee] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [eventFilter, setEventFilter] = useState('all'); 
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

  useEffect(() => {
    if (!selectedEvent?.id) return;

    // Live listener for registrations
    const unsubRegistrations = onSnapshot(
      collection(db, 'events', selectedEvent.id, 'registrations'),
      (snapshot) => {
        const regList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRegistrations(regList);
      }
    );

    // Live listener for attendance
    const unsubAttendance = onSnapshot(
      collection(db, 'events', selectedEvent.id, 'attendance'),
      (snapshot) => {
        const attList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setAttendanceRecords(attList);
      }
    );

    return () => {
      unsubRegistrations();
      unsubAttendance();
    };
  }, [selectedEvent?.id]);

  const disablePastDates = (current) => {
    return current && current < dayjs().startOf('day');
  };

  const handleSubmit = async () => {
    if (!title || !room || !date || !startTime || !endTime) {
      return message.error('Please fill in all fields.');
    }
  };

  const exportAttendanceToExcel = () => {
    if (attendanceRecords.length === 0) {
      return message.warning("No attendance records to export.");
    }

    // ➡️  Fields you NEVER want in the export
    const excludedFields = ['id', 'registrationId', 'regisId', 'submittedAt', 'timestamp'];

    const allKeys = new Set();

    // Collect all keys except the excluded ones
    attendanceRecords.forEach(record => {
      Object.keys(record).forEach(key => {
        if (key !== 'customAnswers' && !excludedFields.includes(key)) {
          allKeys.add(key);
        }
      });

      if (record.customAnswers && typeof record.customAnswers === 'object') {
        Object.keys(record.customAnswers).forEach(key => {
          if (!excludedFields.includes(key)) {
            allKeys.add(key);
          }
        });
      }
    });

    // Put the main fields first
    const priorityFields = ['fullName', 'email', 'year', 'section'];
    const remainingFields = Array.from(allKeys)
      .filter(key => !priorityFields.includes(key))
      .sort();

    const columns = [...priorityFields, ...remainingFields];

    // Build row data
    const data = attendanceRecords.map(record => {
      const row = {};

      columns.forEach(key => {
        // flat field
        if (record.hasOwnProperty(key)) {
          const value = record[key];
          if (typeof value === 'object' && value?.seconds) {
            row[key] = new Date(value.seconds * 1000).toLocaleString();
          } else if (typeof value === 'boolean') {
            row[key] = value ? '✔️ Yes' : '❌ No';
          } else {
            row[key] = value;
          }

        // customAnswers field
        } else if (record.customAnswers?.hasOwnProperty(key)) {
          const value = record.customAnswers[key];
          row[key] = typeof value === 'boolean' ? (value ? '✔️ Yes' : '❌ No') : value;

        } else {
          row[key] = '';
        }
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

    XLSX.writeFile(workbook, 'Attendance_Full.xlsx');
  };

  const exportAttendanceToPDF = async (eventId) => {
    if (attendanceRecords.length === 0) {
      return message.warning("No attendance records to export.");
    }

    const docPDF = new jsPDF({ orientation: 'portrait' });

    let eventTitle = "Event";
    let eventDate = "";
    let eventRoom = "";

    if (eventId) {
      try {
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);

        if (eventSnap.exists()) {
          const eventData = eventSnap.data();
          eventTitle = eventData.title || eventTitle;
          eventDate = eventData.date
            ? new Date(eventData.date.seconds * 1000).toLocaleDateString()
            : '';
          eventRoom = eventData.room || '';
        }
      } catch (error) {
        console.error("Failed to fetch event details:", error);
      }
    }

    // Draw event details
    docPDF.text(`Attendance Report: ${eventTitle}`, 14, 10);
    if (eventDate) docPDF.text(`Date: ${eventDate}`, 14, 16);
    if (eventRoom) docPDF.text(`Room: ${eventRoom}`, 14, 22);

    const isExcluded = (key) =>
      [
        'id',
        'submittedAt',
        'sendCopy',
        'registrationId',
        'dataAgreement',
        'dataPrivacy',
        'dataPrivacyAgreement',
      ].includes(key) ||
      key.toLowerCase().includes('privacy') ||
      key.toLowerCase().includes('agreement');

    const fixedOrder = ['email', 'fullName', 'year', 'section', 'photoConsent', 'videoConsent'];

    const customQuestionKeys = new Set();
    attendanceRecords.forEach((record) => {
      if (record.customAnswers && typeof record.customAnswers === 'object') {
        Object.keys(record.customAnswers).forEach((key) => {
          if (!isExcluded(key)) {
            customQuestionKeys.add(key);
          }
        });
      }
    });

    const sortedCustomQuestions = Array.from(customQuestionKeys).sort();
    const columns = [...fixedOrder, ...sortedCustomQuestions, 'timestamp'];

    const headRow = [
      '#',
      ...columns.map((col) =>
        col.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
      ),
    ];

    const bodyRows = attendanceRecords.map((record, index) => {
      const row = [index + 1];

      columns.forEach((key) => {
        let value = '';

        if (key === 'timestamp') {
          const dateField =
            record.createdAt ||
            record.timestamp ||
            record.time ||
            record.date ||
            record.scannedAt;
          value = dateField?.seconds
            ? new Date(dateField.seconds * 1000).toLocaleString()
            : '';
        } else if (record.hasOwnProperty(key)) {
          const val = record[key];
          value =
            val?.seconds
              ? new Date(val.seconds * 1000).toLocaleString()
              : typeof val === 'boolean'
              ? val ? 'Yes' : 'No'
              : String(val);
        } else if (record.customAnswers?.hasOwnProperty(key)) {
          const customVal = record.customAnswers[key];
          value =
            typeof customVal === 'boolean'
              ? customVal ? 'Yes' : 'No'
              : String(customVal);
        }

        row.push(value);
      });

      return row;
    });

    autoTable(docPDF, {
      head: [headRow],
      body: bodyRows,
      startY: eventRoom || eventDate ? 30 : 20,
      styles: {
        fontSize: 7,
        cellWidth: 'wrap',
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
      },
      margin: { top: 20 },
      theme: 'grid',
    });

    docPDF.save('Attendance_Full.pdf');
  };

  const handleCardClick = async (event) => {
    setSelectedEvent(event);

    const regSnapshot = await getDocs(collection(db, 'events', event.id, 'registrations'));
    const regList = regSnapshot.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
    setRegistrations(regList);

    // Fetch attendance
    const attSnapshot = await getDocs(collection(db, 'events', event.id, 'attendance'));
    const attList = attSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setAttendanceRecords(attList);
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

        <div style={{ marginBottom: 16 }}>
          <Button
            type={eventFilter === 'all' ? 'primary' : 'default'}
            onClick={() => setEventFilter('all')}
            style={{ marginRight: 8 }}
          >
            All Events
          </Button>
          <Button
            type={eventFilter === 'upcoming' ? 'primary' : 'default'}
            onClick={() => setEventFilter('upcoming')}
            style={{ marginRight: 8 }}
          >
            Upcoming Events
          </Button>
          <Button
            type={eventFilter === 'past' ? 'primary' : 'default'}
            onClick={() => setEventFilter('past')}
          >
            Past Events
          </Button>
        </div>
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
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              disabledDate={disablePastDates}
            />
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
              disabledDate={disablePastDates}
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
                    {selectedEvent?.id ? (
                      <div style={{ padding: 12, background: '#fff', display: 'inline-block' }}>
                        <QRCode
                          value={`${window.location.origin}/form/${selectedEvent.id}`}
                          size={128}
                        />
                      </div>
                    ) : (
                      <p>Loading QR Code...</p>
                    )}

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
              label: `Attendance (${attendanceRecords.length})`,
              children: (
                <div className="attendance-tab">
                  <div className="attendance-buttons">
                    <Button type="primary" onClick={exportAttendanceToPDF}>
                      Save PDF
                    </Button>

                    <Button onClick={exportAttendanceToExcel}>
                      Export to Excel
                    </Button>
                  </div>

                  <div className="registration-filters" style={{ marginTop: 16 }}>
                    <Input.Search
                      placeholder="Search by name or email"
                      allowClear
                      onChange={(e) => setSearchText1(e.target.value)}
                      className="ant-input-search"
                      style={{ maxWidth: 300 }}
                    />
                  </div>

                  <div className="attendance-list" style={{ marginTop: 16 }}>
                    {attendanceRecords.length === 0 ? (
                      <p>No attendance records yet.</p>
                    ) : (
                      <ul style={{ paddingLeft: 0 }}>
                        {attendanceRecords
                          .filter(record =>
                            (record.fullName?.toLowerCase().includes(searchText1.toLowerCase()) ||
                            record.email?.toLowerCase().includes(searchText1.toLowerCase()))
                          )
                          .map((record, index) => (
                            <li key={index} style={{ marginBottom: 12, listStyle: 'none' }}>
                              <div
                                onClick={() => {
                                  setSelectedAttendee(record);
                                  setShowAttendanceModal(true);
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                <strong>{record.fullName}</strong> <br />
                                <small>{record.email}</small> <br />
                                <em>Scanned at: {record.timestamp?.seconds ? new Date(record.timestamp.seconds * 1000).toLocaleString() : 'N/A'}</em>
                              </div>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                </div>
              )
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

                // Attendance breakdown
                const attendanceYearCounts = {};
                const attendanceSectionCounts = {};

                attendanceRecords.forEach((attendee) => {
                  const year = attendee.year || 'Unknown';
                  const section = attendee.section || 'Unknown';

                  attendanceYearCounts[year] = (attendanceYearCounts[year] || 0) + 1;
                  attendanceSectionCounts[section] = (attendanceSectionCounts[section] || 0) + 1;
                });

                const attYearData = Object.entries(attendanceYearCounts).map(([key, value]) => ({
                  name: key,
                  value,
                }));

                const attSectionData = Object.entries(attendanceSectionCounts).map(([key, value]) => ({
                  name: key,
                  value,
                }));

                const totalAtt = attendanceRecords.length || 1;

                return (
                  <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                    <h3>📊 Registration Analytics</h3>

                    <h4>📚 By Section (Pie Chart)</h4>
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

                    <h4 style={{ marginTop: 32 }}>📈 By Year (Progress)</h4>
                    {yearData.map((item, index) => (
                      <div key={`year-${item.name}`} style={{ marginBottom: 10 }}>
                        <strong>{item.name}</strong>
                        <Progress
                          percent={((item.value / total) * 100).toFixed(1)}
                          strokeColor={COLORS[index % COLORS.length]}
                          format={(percent) => `${percent}%`}
                        />
                      </div>
                    ))}

                    <hr style={{ margin: '40px 0' }} />

                    <h3>🙋‍♂️ Attendance Analytics</h3>

                    <h4>🧑‍🏫 By Section (Pie Chart)</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={attSectionData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#82ca9d"
                          dataKey="value"
                          label
                        >
                          {attSectionData.map((_, index) => (
                            <Cell key={`att-section-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>

                    <h4 style={{ marginTop: 32 }}>📅 By Year (Progress)</h4>
                    {attYearData.map((item, index) => (
                      <div key={`att-year-${item.name}`} style={{ marginBottom: 10 }}>
                        <strong>{item.name}</strong>
                        <Progress
                          percent={((item.value / totalAtt) * 100).toFixed(1)}
                          strokeColor={COLORS[index % COLORS.length]}
                          format={(percent) => `${percent}%`}
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
          .filter(event => {
            const matchTitle = event.title.toLowerCase().includes(searchText.toLowerCase());
            const isPast = dayjs(event.date).isBefore(dayjs(), 'day');
            if (eventFilter === 'past') return matchTitle && isPast;
            if (eventFilter === 'upcoming') return matchTitle && !isPast;
            return matchTitle;
          })
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
                  
                  <Tag
                    className="date-badge"
                    color={dayjs(event.date).isBefore(dayjs(), 'day') ? 'red' : 'green'}
                  >
                    Date: {event.date}
                  </Tag>
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
              const orderedKeys = [
                'email',
                'fullName',
                'year',
                'section',
                'dataPrivacyAgreement',
                'photoConsent',
                'videoConsent',
                'submittedAt',
              ];

              const keyLabels = {
                email: 'Email',
                fullName: 'Name',
                year: 'Year',
                section: 'Section',
                dataPrivacyAgreement: 'Data Privacy Agreement',
                photoConsent: 'Photo Consent',
                videoConsent: 'Video Consent',
                submittedAt: 'Submitted',
              };

              const defaultFields = orderedKeys.map((key) => {
                const value = selectedRegistrant[key];
                if (value === undefined) return null;

                let displayValue;

                if (typeof value === 'boolean') {
                  displayValue = value ? '✔️ Yes' : '❌ No';
                } else if (Array.isArray(value)) {
                  displayValue = value.join(', ');
                } else if (typeof value === 'object' && value !== null && 'seconds' in value) {
                  displayValue = new Date(value.seconds * 1000).toLocaleString();
                } else {
                  displayValue = value;
                }

                return (
                  <div key={key} style={{ marginBottom: 10 }}>
                    <strong>{keyLabels[key] || key}:</strong> {displayValue}
                  </div>
                );
              });

              const customFields = [];
              if (
                selectedRegistrant.customAnswers &&
                typeof selectedRegistrant.customAnswers === 'object'
              ) {
                Object.entries(selectedRegistrant.customAnswers).forEach(([question, answer], index) => {
                  const displayAnswer =
                    typeof answer === 'boolean' ? (answer ? '✔️ Yes' : '❌ No') : answer;

                  customFields.push(
                    <div key={index} style={{ marginBottom: 10 }}>
                      <strong>{question}:</strong> {displayAnswer}
                    </div>
                  );
                });
              }

              return (
                <>
                  <h4>📝 Basic Details</h4>
                  {defaultFields}

                  {customFields.length > 0 && (
                    <>
                      <h4 style={{ marginTop: 20 }}>Custom Questions</h4>
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
        open={showAttendanceModal}
        onCancel={() => {
          setShowAttendanceModal(false);
          setSelectedAttendee(null);
        }}
        footer={null}
        title={selectedAttendee?.fullName || "Attendee Details"}
        width={600}
      >
        {selectedAttendee ? (
          <div>
            {(() => {
              const orderedKeys = [
                'email',
                'fullName',
                'year',
                'section',
                'photoConsent',
                'videoConsent',
              ];

              const keyLabels = {
                email: 'Email',
                fullName: 'Full Name',
                year: 'Year',
                section: 'Section',
                photoConsent: 'Photo Consent',
                videoConsent: 'Video Consent',
              };

              const defaultFields = orderedKeys.map((key) => {
                const value = selectedAttendee[key];
                if (value === undefined) return null;

                let displayValue;
                if (typeof value === 'boolean') {
                  displayValue = value ? '✔️ Yes' : '❌ No';
                } else if (typeof value === 'object' && value?.seconds) {
                  displayValue = new Date(value.seconds * 1000).toLocaleString();
                } else {
                  displayValue = value;
                }

                return (
                  <div key={key} style={{ marginBottom: 10 }}>
                    <strong>{keyLabels[key]}:</strong> {displayValue}
                  </div>
                );
              });

              const customFields = [];
              if (
                selectedAttendee.customAnswers &&
                typeof selectedAttendee.customAnswers === 'object'
              ) {
                Object.entries(selectedAttendee.customAnswers).forEach(([question, answer], index) => {
                  const displayAnswer =
                    typeof answer === 'boolean' ? (answer ? '✔️ Yes' : '❌ No') : answer;

                  customFields.push(
                    <div key={index} style={{ marginBottom: 10 }}>
                      <strong>{question}:</strong> {displayAnswer}
                    </div>
                  );
                });
              }

              return (
                <>
                  <h4>📝 Attendee Info</h4>
                  {defaultFields}

                  {customFields.length > 0 && (
                    <>
                      <h4 style={{ marginTop: 20 }}>Custom Answers</h4>
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
