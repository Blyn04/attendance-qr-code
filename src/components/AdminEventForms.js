// VERSION 1
// import React, { useEffect, useState } from 'react';
// import { db } from '../config/FirebaseConfig';
// import {
//   collection,
//   getDocs,
//   getDoc,
//   doc,
//   updateDoc,
//   setDoc,
//   onSnapshot
// } from 'firebase/firestore';
// import {
//   Button,
//   Card,
//   Row,
//   Col,
//   message,
//   Modal,
//   Form,
//   Input,
//   TimePicker,
//   DatePicker,
//   Space,
//   Select,
//   Switch
// } from 'antd';
// import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
// import { useNavigate } from 'react-router-dom';
// import dayjs from 'dayjs';
// import '../styles/AdminEventForms.css';

// const { Option } = Select;
// const { Search } = Input;

// const AdminEventForms = () => {
//   const [events, setEvents] = useState([]);
//   const [editingEvent, setEditingEvent] = useState(null);
//   const [editModalVisible, setEditModalVisible] = useState(false);
//   const [searchText, setSearchText] = useState('');
//   const [form] = Form.useForm();
//   const navigate = useNavigate();

//   const fetchEvents = async () => {
//     const snapshot = await getDocs(collection(db, 'events'));
//     const list = await Promise.all(snapshot.docs.map(async docSnap => {
//       const eventId = docSnap.id;
//       const eventData = docSnap.data();

//       const formRef = doc(db, 'events', eventId, 'form', 'template');
//       const formSnap = await getDoc(formRef);
//       const formTemplate = formSnap.exists() ? formSnap.data() : null;

//       return {
//         id: eventId,
//         ...eventData,
//         formTemplate
//       };
//     }));
//     setEvents(list);
//   };

//   useEffect(() => {
//     const unsub = onSnapshot(collection(db, 'events'), async (snapshot) => {
//       const list = await Promise.all(snapshot.docs.map(async docSnap => {
//         const eventId = docSnap.id;
//         const eventData = docSnap.data();

//         const formRef = doc(db, 'events', eventId, 'form', 'template');
//         const formSnap = await getDoc(formRef);
//         const formTemplate = formSnap.exists() ? formSnap.data() : null;

//         return {
//           id: eventId,
//           ...eventData,
//           formTemplate
//         };
//       }));

//       list.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
//       setEvents(list);
//     });

//     return () => unsub();
//   }, []);

//   const copyLink = (id) => {
//     const url = `${window.location.origin}/form/${id}`;
//     navigator.clipboard.writeText(url);
//     message.success('Form link copied to clipboard!');
//   };

//   const openFormEditor = (event) => {
//     const defaultDeadline = event.formDeadline
//       ? dayjs(event.formDeadline)
//       : dayjs(`${event.date} ${event.endTime || '23:59'}`);

//     setEditingEvent(event);
//     form.setFieldsValue({
//       title: event.title,
//       room: event.room || '',
//       date: dayjs(event.date),
//       startTime: dayjs(event.startTime, 'HH:mm'),
//       endTime: dayjs(event.endTime, 'HH:mm'),
//       formDeadline: defaultDeadline,
//       customQuestions: event.formTemplate?.customQuestions || [],
//     });
//     setEditModalVisible(true);
//   };

//   const handleUpdate = async () => {
//     try {
//       const values = await form.validateFields();

//       const existingTitles = events
//         .filter(e => e.id !== editingEvent.id)
//         .map(e => e.title.trim().toLowerCase());

//       if (existingTitles.includes(values.title.trim().toLowerCase())) {
//         return message.error('An event with this title already exists.');
//       }

//       const labels = values.customQuestions?.map(q => q.label?.trim().toLowerCase()).filter(Boolean);
//       const labelSet = new Set(labels);
//       if (labels.length !== labelSet.size) {
//         return message.error('Custom question labels must be unique.');
//       }

//       const eventRef = doc(db, 'events', editingEvent.id);
//       const formTemplateRef = doc(db, 'events', editingEvent.id, 'form', 'template');

//       await updateDoc(eventRef, {
//         title: values.title,
//         room: values.room,
//         date: values.date.format('YYYY-MM-DD'),
//         startTime: values.startTime.format('HH:mm'),
//         endTime: values.endTime.format('HH:mm'),
//         formDeadline: values.formDeadline.toISOString(),
//       });

//       const existingFormSnap = await getDoc(formTemplateRef);
//       let existingFormData = existingFormSnap.exists() ? existingFormSnap.data() : {};

//       const cleanObject = (obj) => {
//         if (Array.isArray(obj)) {
//           return obj.map(cleanObject).filter((item) => item !== undefined && item !== null);
//         } else if (obj && typeof obj === 'object') {
//           const cleaned = {};
//           for (const [key, value] of Object.entries(obj)) {
//             const v = cleanObject(value);
//             if (v !== undefined && v !== null) {
//               cleaned[key] = v;
//             }
//           }
//           return cleaned;
//         } else if (obj !== undefined) {
//           return obj;
//         }
//         return undefined;
//       };

//       existingFormData = cleanObject(existingFormData);

//       const updatedTemplate = {
//         ...existingFormData,
//         customQuestions: cleanObject(values.customQuestions || []),
//       };

//       await setDoc(formTemplateRef, updatedTemplate);

//       message.success('Event updated successfully!');
//       setEditModalVisible(false);

//       // Reload updated events
//       const snapshot = await getDocs(collection(db, 'events'));
//       const list = await Promise.all(snapshot.docs.map(async docSnap => {
//         const eventId = docSnap.id;
//         const eventData = docSnap.data();
//         const formRef = doc(db, 'events', eventId, 'form', 'template');
//         const formSnap = await getDoc(formRef);
//         const formTemplate = formSnap.exists() ? formSnap.data() : null;

//         return {
//           id: eventId,
//           ...eventData,
//           formTemplate
//         };
//       }));

//       list.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
//       setEvents(list);

//     } catch (error) {
//       console.error('Error updating event:', error);
//       message.error('Failed to update event');
//     }
//   };

//   return (
//     <div className="admin-container">
//       <div className="search-bar-container">
//         <Search
//           placeholder="Search event title..."
//           allowClear
//           enterButton
//           value={searchText}
//           onChange={(e) => setSearchText(e.target.value)}
//           className="search-bar"
//         />
//       </div>

//       <Row gutter={[24, 24]} className="event-row">
//         {events
//           .filter(event =>
//             event.title.toLowerCase().includes(searchText.toLowerCase())
//           )
//           .map(event => (
//             <Col key={event.id} xs={24} sm={12} md={12} lg={8} className="event-col">
//               <Card className="event-card" title={event.title} bordered hoverable>
//                 <div className="event-details">
//                   <p className="event-detail"><strong>Date:</strong> {event.date}</p>
//                   <p className="event-detail"><strong>Time:</strong> {event.startTime} - {event.endTime}</p>
//                   <p className="event-detail"><strong>Room:</strong> {event.room || 'TBD'}</p>
//                   {event.formDeadline && (
//                     <p className="event-detail">
//                       <strong>Form Closes:</strong> {dayjs(event.formDeadline).format('YYYY-MM-DD HH:mm')}
//                     </p>
//                   )}
//                 </div>

//                 {event.formTemplate ? (
//                   <div className="button-group">
//                     <a href={`/form/${event.id}`} target="_blank" rel="noopener noreferrer">
//                       <Button className="view-form-btn" type="primary">View Form</Button>
//                     </a>
//                     <Button className="copy-link-btn" onClick={() => copyLink(event.id)}>Copy Link</Button>
//                     <Button className="edit-btn" onClick={() => openFormEditor(event)} type="dashed">Edit</Button>
//                   </div>
//                 ) : (
//                   <p className="no-form-warning">⚠ No form template found</p>
//                 )}
//               </Card>
//             </Col>
//         ))}
//       </Row>

//       <Modal
//         open={editModalVisible}
//         title="Edit Event"
//         onCancel={() => setEditModalVisible(false)}
//         onOk={handleUpdate}
//         okText="Save Changes"
//         className="edit-event-modal"
//       >
//         <Form form={form} layout="vertical" className="event-form">
//           <Form.Item label="Event Title" name="title" rules={[{ required: true }]} className="form-item">
//             <Input className="form-input" />
//           </Form.Item>

//           <Form.Item label="Room / Venue" name="room" rules={[{ required: true }]} className="form-item">
//             <Input className="form-input" />
//           </Form.Item>

//           <Form.Item label="Date" name="date" rules={[{ required: true }]} className="form-item">
//             <DatePicker className="custom-datepicker" style={{ width: '100%' }} />
//           </Form.Item>

//           <Form.Item label="Start Time" name="startTime" rules={[{ required: true }]} className="form-item">
//             <TimePicker format="HH:mm" style={{ width: '100%' }} minuteStep={5} className="form-timepicker" />
//           </Form.Item>

//           <Form.Item label="End Time" name="endTime" rules={[{ required: true }]} className="form-item">
//             <TimePicker format="HH:mm" style={{ width: '100%' }} minuteStep={5} className="form-timepicker" />
//           </Form.Item>

//           <Form.Item
//             label="Form Closes At"
//             name="formDeadline"
//             rules={[{ required: true, message: 'Please set the form closing time' }]}
//             className="form-item"
//           >
//             <DatePicker
//               showTime={{ minuteStep: 10 }}
//               format="YYYY-MM-DD HH:mm"
//               style={{ width: '100%' }}
//               className="form-deadline-picker"
//             />
//           </Form.Item>

//           <Form.List name="customQuestions">
//             {(fields, { add, remove }) => (
//               <div className="custom-question-list">
//                 <label className="custom-question-label">📝 Custom Questions (for registration form)</label>
//                 {fields.map(({ key, name, ...restField }) => (
//                   <Space key={key} direction="vertical" className="custom-question-item" style={{ width: '100%' }}>
//                     <Form.Item
//                       shouldUpdate
//                       noStyle
//                     >
//                       {({ getFieldValue }) => {
//                         const required = getFieldValue(['customQuestions', name, 'required']) ?? false;
//                         return (
//                           <Form.Item
//                             {...restField}
//                             name={[name, 'label']}
//                             label={`Question ${name + 1}`}
//                             rules={[
//                               required && { required: true, message: 'Please input the question text' },
//                               {
//                                 validator: async (_, value) => {
//                                   const labels = form.getFieldValue('customQuestions')?.map(q =>
//                                     (q?.label || '').trim().toLowerCase()
//                                   );
//                                   const occurrences = labels.filter(v => v === (value || '').trim().toLowerCase());
//                                   if (occurrences.length > 1) {
//                                     throw new Error('Duplicate question label');
//                                   }
//                                 }
//                               }
//                             ].filter(Boolean)}
//                             className="form-item"
//                           >
//                             <Input className="form-input" placeholder="e.g. What's your full name?" />
//                           </Form.Item>
//                         );
//                       }}
//                     </Form.Item>

//                     <Form.Item
//                       {...restField}
//                       name={[name, 'type']}
//                       label="Input Type"
//                       rules={[{ required: true, message: 'Please select an input type' }]}
//                       className="form-item"
//                     >
//                       <Select placeholder="Select input type" className="form-select">
//                         <Option value="text">Text</Option>
//                         <Option value="email">Email</Option>
//                         <Option value="number">Number</Option>
//                         <Option value="checkbox">Checkbox</Option>
//                       </Select>
//                     </Form.Item>

//                     <Form.Item
//                       {...restField}
//                       label="Required?"
//                       name={[name, 'required']}
//                       valuePropName="checked"
//                       className="form-item"
//                     >
//                       <Switch
//                         className="custom-required-switch"
//                         checkedChildren="Yes"
//                         unCheckedChildren="No"
//                       />
//                     </Form.Item>

//                     <Button danger type="link" onClick={() => remove(name)} className="remove-question-btn">
//                       Remove
//                     </Button>
//                     <hr />
//                   </Space>
//                 ))}
//                 <Form.Item className="add-question-container">
//                   <Button type="dashed" onClick={() => add()} block className="add-question-btn">
//                     + Add Question
//                   </Button>
//                 </Form.Item>
//               </div>
//             )}
//           </Form.List>
//         </Form>
//       </Modal>
//     </div>
//   );
// };

// export default AdminEventForms;


// VERSION 2
import React, { useEffect, useState } from 'react';
import { db } from '../config/FirebaseConfig';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  setDoc,
  onSnapshot,
  deleteDoc
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
  Switch,
  Popconfirm
} from 'antd';
import { MinusCircleOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
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

      list.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
      setEvents(list);
    });

    return () => unsub();
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
      formDeadline: defaultDeadline,
      customQuestions: event.formTemplate?.customQuestions || [],
    });
    
    setEditModalVisible(true);
  };

  const handleRemove = async (eventId) => {
    try {
      await deleteDoc(doc(db, 'events', eventId));
      await deleteDoc(doc(db, 'events', eventId, 'form', 'template'));
      message.success('Event deleted successfully');

    } catch (error) {
      console.error('Error deleting event:', error);
      message.error('Failed to delete event');
    }
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();

      const existingTitles = events
        .filter(e => e.id !== editingEvent.id)
        .map(e => e.title.trim().toLowerCase());

      if (existingTitles.includes(values.title.trim().toLowerCase())) {
        return message.error('An event with this title already exists.');
      }

      const labels = values.customQuestions?.map(q => q.label?.trim().toLowerCase()).filter(Boolean);
      const labelSet = new Set(labels);
      if (labels.length !== labelSet.size) {
        return message.error('Custom question labels must be unique.');
      }

      const eventRef = doc(db, 'events', editingEvent.id);
      const formTemplateRef = doc(db, 'events', editingEvent.id, 'form', 'template');

      await updateDoc(eventRef, {
        title: values.title,
        room: values.room,
        date: values.date.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
        formDeadline: values.formDeadline.toISOString(),
      });

      const existingFormSnap = await getDoc(formTemplateRef);
      let existingFormData = existingFormSnap.exists() ? existingFormSnap.data() : {};

      const cleanObject = (obj) => {
        if (Array.isArray(obj)) {
          return obj.map(cleanObject).filter((item) => item !== undefined && item !== null);

        } else if (obj && typeof obj === 'object') {
          const cleaned = {};
          for (const [key, value] of Object.entries(obj)) {
            const v = cleanObject(value);
            if (v !== undefined && v !== null) {
              cleaned[key] = v;
            }
          }
          return cleaned;

        } else if (obj !== undefined) {
          return obj;
        }
        return undefined;
      };

      existingFormData = cleanObject(existingFormData);

      const updatedTemplate = {
        ...existingFormData,
        customQuestions: cleanObject(values.customQuestions || []),
      };

      await setDoc(formTemplateRef, updatedTemplate);

      message.success('Event updated successfully!');
      setEditModalVisible(false);

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

      list.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
      setEvents(list);

    } catch (error) {
      console.error('Error updating event:', error);
      message.error('Failed to update event');
    }
  };

  return (
    <div className="admin-container">
      <div className="search-bar-container">
        <Search
          placeholder="Search event title..."
          allowClear
          enterButton
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="search-bar"
        />
      </div>

      <Row gutter={[24, 24]} className="event-row">
        {events
          .filter(event =>
            event.title.toLowerCase().includes(searchText.toLowerCase())
          )
          .map(event => (
            <Col key={event.id} xs={24} sm={12} md={12} lg={8} className="event-col">
              <Card className="event-card" title={event.title} bordered hoverable>
                <div className="event-details">
                  <p className="event-detail"><strong>Date:</strong> {event.date}</p>
                  <p className="event-detail"><strong>Time:</strong> {event.startTime} - {event.endTime}</p>
                  <p className="event-detail"><strong>Room:</strong> {event.room || 'TBD'}</p>
                  {event.formDeadline && (
                    <p className="event-detail">
                      <strong>Form Closes:</strong> {dayjs(event.formDeadline).format('YYYY-MM-DD HH:mm')}
                    </p>
                  )}
                </div>

                {event.formTemplate ? (
                  <div className="button-group">
                    <a href={`/form/${event.id}`} target="_blank" rel="noopener noreferrer">
                      <Button className="view-form-btn" type="primary">View Form</Button>
                    </a>
                    <Button className="copy-link-btn" onClick={() => copyLink(event.id)}>Copy Link</Button>
                    <Button className="edit-btn" onClick={() => openFormEditor(event)} type="dashed">Edit</Button>
                    <Popconfirm
                      title="Are you sure you want to delete this event?"
                      onConfirm={() => handleRemove(event.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button danger icon={<DeleteOutlined />}>
                        Remove
                      </Button>
                    </Popconfirm>
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
        className="edit-event-modal"
      >
        <Form form={form} layout="vertical" className="event-form">
          <Form.Item label="Event Title" name="title" rules={[{ required: true }]} className="form-item">
            <Input className="form-input" />
          </Form.Item>

          <Form.Item label="Room / Venue" name="room" rules={[{ required: true }]} className="form-item">
            <Input className="form-input" />
          </Form.Item>

          <Form.Item label="Date" name="date" rules={[{ required: true }]} className="form-item">
            <DatePicker className="custom-datepicker" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Start Time" name="startTime" rules={[{ required: true }]} className="form-item">
            <TimePicker format="HH:mm" style={{ width: '100%' }} minuteStep={5} className="form-timepicker" />
          </Form.Item>

          <Form.Item label="End Time" name="endTime" rules={[{ required: true }]} className="form-item">
            <TimePicker format="HH:mm" style={{ width: '100%' }} minuteStep={5} className="form-timepicker" />
          </Form.Item>

          <Form.Item
            label="Form Closes At"
            name="formDeadline"
            rules={[{ required: true, message: 'Please set the form closing time' }]}
            className="form-item"
          >
            <DatePicker
              showTime={{ minuteStep: 10 }}
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              className="form-deadline-picker"
            />
          </Form.Item>

          <Form.List name="customQuestions">
            {(fields, { add, remove }) => (
              <div className="custom-question-list">
                <label className="custom-question-label">📝 Custom Questions (for registration form)</label>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} direction="vertical" className="custom-question-item" style={{ width: '100%' }}>
                    <Form.Item shouldUpdate noStyle>
                      {({ getFieldValue }) => {
                        const required = getFieldValue(['customQuestions', name, 'required']) ?? false;
                        return (
                          <Form.Item
                            {...restField}
                            name={[name, 'label']}
                            label={`Question ${name + 1}`}
                            rules={[
                              required && { required: true, message: 'Please input the question text' },
                              {
                                validator: async (_, value) => {
                                  const labels = form.getFieldValue('customQuestions')?.map(q =>
                                    (q?.label || '').trim().toLowerCase()
                                  );
                                  const occurrences = labels.filter(v => v === (value || '').trim().toLowerCase());
                                  if (occurrences.length > 1) {
                                    throw new Error('Duplicate question label');
                                  }
                                }
                              }
                            ].filter(Boolean)}
                            className="form-item"
                          >
                            <Input className="form-input" placeholder="e.g. What's your full name?" />
                          </Form.Item>
                        );
                      }}
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'type']}
                      label="Input Type"
                      rules={[{ required: true, message: 'Please select an input type' }]}
                      className="form-item"
                    >
                      <Select placeholder="Select input type" className="form-select">
                        <Option value="text">Text</Option>
                        <Option value="email">Email</Option>
                        <Option value="number">Number</Option>
                        <Option value="checkbox">Checkbox</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      label="Required?"
                      name={[name, 'required']}
                      valuePropName="checked"
                      className="form-item"
                    >
                      <Switch
                        className="custom-required-switch"
                        checkedChildren="Yes"
                        unCheckedChildren="No"
                      />
                    </Form.Item>

                    <Button danger type="link" onClick={() => remove(name)} className="remove-question-btn">
                      Remove
                    </Button>
                    <hr />
                  </Space>
                ))}
                <Form.Item className="add-question-container">
                  <Button type="dashed" onClick={() => add()} block className="add-question-btn">
                    + Add Question
                  </Button>
                </Form.Item>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminEventForms;
