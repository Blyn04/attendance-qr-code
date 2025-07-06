import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Tabs } from 'antd';
import {
  ShoppingOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import CustomDashboardCalendar from '../customs/CustomDashboardCalendar';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/FirebaseConfig';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

import '../styles/Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const { TabPane } = Tabs;

const Dashboard = () => {
  const [eventCount, setEventCount] = useState(0);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, 'events'));
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEventCount(events.length);

      const eventLabels = [];
      const registrationsCount = [];

      for (const event of events) {
        const registrationsSnap = await getDocs(collection(db, 'events', event.id, 'registrations'));
        eventLabels.push(event.title);
        registrationsCount.push(registrationsSnap.size);
      }

      setChartData({
        labels: eventLabels,
        datasets: [
          {
            label: 'Registrations per Event',
            data: registrationsCount,
            backgroundColor: '#69c0ff',
          },
        ],
      });
    };

    fetchData();
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
            <h3>📅 Calendar</h3>
            <CustomDashboardCalendar />
          </Card>
        </TabPane>

        <TabPane tab="Analytics" key="analytics">
          <Card>
            <h3><BarChartOutlined /> Registrations Overview</h3>
            {chartData.labels.length > 0 ? (
              <Bar data={chartData} />
            ) : (
              <p>No data available</p>
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Dashboard;
