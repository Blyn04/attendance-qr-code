import React, { useEffect, useState } from 'react';
import { Calendar, Badge, Modal, List } from 'antd';
import { db } from '../config/FirebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import dayjs from 'dayjs';

const CustomDashboardCalendar = () => {
  const [eventsByDate, setEventsByDate] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      const snapshot = await getDocs(collection(db, 'events'));
      const grouped = {};

      snapshot.forEach(doc => {
        const data = doc.data();
        const dateKey = data.date; // 'YYYY-MM-DD'

        if (!grouped[dateKey]) grouped[dateKey] = [];

        grouped[dateKey].push({
          id: doc.id,
          type: 'success',
          title: data.title,
          startTime: data.startTime,
          endTime: data.endTime,
          formDeadline: data.formDeadline,
        });
      });

      setEventsByDate(grouped);
    };

    fetchEvents();
  }, []);

  const dateCellRender = (value) => {
    const dateKey = value.format('YYYY-MM-DD');
    const listData = eventsByDate[dateKey] || [];

    return (
      <ul className="events">
        {listData.map((item, idx) => (
          <li key={idx}>
            <Badge status={item.type} text={item.title} />
          </li>
        ))}
      </ul>
    );
  };

  const onSelect = (value) => {
    const dateKey = value.format('YYYY-MM-DD');
    const dayEvents = eventsByDate[dateKey];
    if (dayEvents && dayEvents.length > 0) {
      setSelectedDate({ date: dateKey, events: dayEvents });
      setModalVisible(true);
    }
  };

  return (
    <>
      <Calendar
        dateCellRender={dateCellRender}
        onSelect={onSelect}
      />

      <Modal
        title={`Events on ${selectedDate?.date}`}
        open={modalVisible}
        footer={null}
        onCancel={() => setModalVisible(false)}
      >
        <List
          itemLayout="vertical"
          dataSource={selectedDate?.events || []}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <List.Item.Meta
                title={item.title}
                description={
                  <>
                    <p><strong>Time:</strong> {item.startTime} – {item.endTime}</p>
                    {item.formDeadline && (
                      <p><strong>Form Closes:</strong> {dayjs(item.formDeadline).format('YYYY-MM-DD HH:mm')}</p>
                    )}
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </>
  );
};

export default CustomDashboardCalendar;
