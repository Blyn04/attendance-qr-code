import React, { useEffect, useState } from 'react';
import { db } from '../config/FirebaseConfig';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  setDoc,
  onSnapshot
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
  DatePicker,
  Space,
  Select,
  Switch
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import '../styles/AdminEventForms.css';

const { Option } = Select;
const { Search } = Input;

const AdminEventForms = () => {
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
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
    const unsub = onSnapshot(collection(db, 'events'), async (snapshot) => {
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

      // Sort by date ascending
      list.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
      setEvents(list);
    });

    return () => unsub();
  }, [])

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
      formDeadline: defaultDeadline,
      customQuestions: event.formTemplate?.customQuestions || [],
    });
    setEditModalVisible(true);
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      const eventRef = doc(db, 'events', editingEvent.id);
      const formTemplateRef = doc(db, 'events', editingEvent.id, 'form', 'template');

      // Update event main info
      await updateDoc(eventRef, {
        title: values.title,
        room: values.room,
        date: values.date.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
        formDeadline: values.formDeadline.toISOString(),
      });

      // Save custom questions to form/template
      await setDoc(formTemplateRef, {
        customQuestions: values.customQuestions || [],
      }, { merge: true });

      message.success('Event updated successfully!');
      setEditModalVisible(false);

    } catch (error) {
      console.error('Error updating event:', error);
      message.error('Failed to update event');
    }
  };

  return (
    <div className="admin-container">
      <h1 className="admin-title">📋 Manage Event Forms</h1>

      <div style={{ display: 'block', marginBottom: 24 }}>
        <Search
          placeholder="Search event title..."
          allowClear
          enterButton
          size="large"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            maxWidth: 300,
            height: 40, // 👈 Fixes vertical mismatch
            lineHeight: '40px',
          }}
        />
      </div>

      <Row gutter={[24, 24]}>
        {events
          .filter(event =>
            event.title.toLowerCase().includes(searchText.toLowerCase())
          )
          .map(event => (

          <Col key={event.id} xs={24} sm={12} md={12} lg={8}>
            <Card className="event-card" title={event.title} bordered hoverable>
              <p><strong>Date:</strong> {event.date}</p>
              <p><strong>Time:</strong> {event.startTime} - {event.endTime}</p>
              <p><strong>Room:</strong> {event.room || 'TBD'}</p>
              {event.formDeadline && (
                <p><strong>Form Closes:</strong> {dayjs(event.formDeadline).format('YYYY-MM-DD HH:mm')}</p>
              )}

              {event.formTemplate ? (
                <div className="button-group">
                  <a href={`/form/${event.id}`} target="_blank" rel="noopener noreferrer">
                    <Button type="primary">View Form</Button>
                  </a>
                  <Button onClick={() => copyLink(event.id)}>Copy Link</Button>
                  <Button onClick={() => openFormEditor(event)} type="dashed">Edit</Button>
                </div>
              ) : (
                <p className="no-form-warning">⚠ No form template found</p>
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
            <DatePicker
              className="custom-datepicker"
              style={{ width: '100%' }}
            />
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
              showTime={{ minuteStep: 10 }}
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>

      <Form.List name="customQuestions">
        {(fields, { add, remove }) => (
          <>
            <label>📝 Custom Questions (for registration form)</label>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} direction="vertical" style={{ display: 'block', marginBottom: 8 }}>
                <Form.Item
                  {...restField}
                  name={[name, 'label']}
                  label={`Question ${name + 1}`}
                  rules={[{ required: true, message: 'Please input the question text' }]}
                >
                  <Input placeholder="e.g. What's your full name?" />
                </Form.Item>

                <Form.Item
                  {...restField}
                  name={[name, 'type']}
                  label="Input Type"
                  rules={[{ required: true, message: 'Please select an input type' }]}
                >
                  <Select placeholder="Select input type">
                    <Option value="text">Text</Option>
                    <Option value="email">Email</Option>
                    <Option value="number">Number</Option>
                    <Option value="checkbox">Checkbox</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="" colon={false} className="question-required-toggle">
                  <div className="toggle-row">
                    <span className="toggle-label">Required?</span>
                    <Form.Item
                      {...restField}
                      name={[name, 'required']}
                      valuePropName="checked"
                      noStyle
                    >
                      <Switch
                        className="custom-required-switch"
                        checkedChildren="Yes"
                        unCheckedChildren="No"
                      />
                    </Form.Item>
                  </div>
                </Form.Item>

                <Button danger type="link" onClick={() => remove(name)}>Remove</Button>
                <hr />
              </Space>
            ))}
            <Form.Item>
              <Button type="dashed" onClick={() => add()} block>
                + Add Question
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminEventForms;
