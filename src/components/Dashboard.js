import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Tabs } from 'antd';
import {
  FileOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  ProfileOutlined
} from '@ant-design/icons';
import CustomDashboardCalendar from '../customs/CustomDashboardCalendar';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/FirebaseConfig';

const { TabPane } = Tabs;

const Dashboard = () => {
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    const fetchEventCount = async () => {
      const snapshot = await getDocs(collection(db, 'events'));
      setEventCount(snapshot.size);
    };

    fetchEventCount();
  }, []);

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>

        <Col span={6}>
          <Card bordered style={{ background: '#D6F5E3' }}>
            <ShoppingOutlined style={{ fontSize: 28 }} />
            <h2>{eventCount}</h2>
            <p>Total Events</p>
          </Card>
        </Col>

      </Row>

      <Tabs defaultActiveKey="calendar">
        <TabPane tab="Calendar" key="calendar">
          <Card>
            <h3>Calendar</h3>
            <CustomDashboardCalendar />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Dashboard;
