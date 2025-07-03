import React, { useEffect, useState } from 'react';
import { db } from '../config/FirebaseConfig';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import {
  Button,
  Card,
  Row,
  Col,
  message,
  Modal,
  Form,
  Input,
  TimePicker,
  DatePicker
} from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const AdminEventForms = () => {
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetchEvents = async () => {
    const snapshot = await getDocs(collection(db, 'events'));
    const list = await Promise.all(snapshot.docs.map(async docSnap => {
      const eventId = docSnap.id;
      const eventData = docSnap.data();

      const formRef = doc(db, 'events', eventId, 'form', 'template');
      const formSnap = await getDoc(formRef);
      const formTemplate = formSnap.exists() ? formSnap.data() : null;

      return {
        id: eventId,
        ...eventData,
        formTemplate
      };
    }));
    setEvents(list);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const copyLink = (id) => {
    const url = `${window.location.origin}/form/${id}`;
    navigator.clipboard.writeText(url);
    message.success('Form link copied to clipboard!');
  };

  const openFormEditor = (event) => {
    const defaultDeadline = event.formDeadline
      ? dayjs(event.formDeadline)
      : dayjs(`${event.date} ${event.endTime || '23:59'}`);

    setEditingEvent(event);
    form.setFieldsValue({
      title: event.title,
      room: event.room || '',
      date: dayjs(event.date),
      startTime: dayjs(event.startTime, 'HH:mm'),
      endTime: dayjs(event.endTime, 'HH:mm'),
      formDeadline: defaultDeadline
    });
    setEditModalVisible(true);
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      const eventRef = doc(db, 'events', editingEvent.id);
      await updateDoc(eventRef, {
        title: values.title,
        room: values.room,
        date: values.date.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
        formDeadline: values.formDeadline.toISOString(),
      });
      message.success('Event updated successfully!');
      setEditModalVisible(false);
      fetchEvents();
    } catch (error) {
      console.error('Error updating event:', error);
      message.error('Failed to update event');
    }
  };

  return (
    <div>
      <h2>Manage Event Forms</h2>
      <Row gutter={[16, 16]}>
        {events.map(event => (
          <Col key={event.id} span={12}>
            <Card title={event.title} bordered={true}>
              <p><strong>Date:</strong> {event.date}</p>
              <p><strong>Time:</strong> {event.startTime} - {event.endTime}</p>
              <p><strong>Room:</strong> {event.room || 'TBD'}</p>

              {event.formDeadline && (
                <p><strong>Form Closes At:</strong> {dayjs(event.formDeadline).format('YYYY-MM-DD HH:mm')}</p>
              )}

              {event.formTemplate ? (
                <>
                  <a
                    href={`/form/${event.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button type="primary">View Form</Button>
                  </a>{' '}
                  <Button onClick={() => copyLink(event.id)}>Copy Form Link</Button>{' '}
                  <Button onClick={() => openFormEditor(event)}>Edit Form</Button>
                </>
              ) : (
                <p style={{ color: 'red' }}>No form template found</p>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        open={editModalVisible}
        title="Edit Event"
        onCancel={() => setEditModalVisible(false)}
        onOk={handleUpdate}
        okText="Save Changes"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Event Title" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Room / Venue" name="room" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Date" name="date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Start Time" name="startTime" rules={[{ required: true }]}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} minuteStep={5} />
          </Form.Item>

          <Form.Item label="End Time" name="endTime" rules={[{ required: true }]}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} minuteStep={5} />
          </Form.Item>

          <Form.Item
            label="Form Closes At"
            name="formDeadline"
            rules={[{ required: true, message: 'Please set the form closing time' }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminEventForms;
