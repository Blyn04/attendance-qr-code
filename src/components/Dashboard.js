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
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import dayjs from 'dayjs';

import '../styles/Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const { TabPane } = Tabs;

const Dashboard = () => {
  const [eventCount, setEventCount] = useState(0);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [yearSectionData, setYearSectionData] = useState({});
  const [upcomingEvent, setUpcomingEvent] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, 'events'));
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEventCount(events.length);

      const eventLabels = [];
      const registrationsCount = [];
      const yearBreakdown = {}; // { "Event Title": { "1st Year - INF123": 5, ... } }

      for (const event of events) {
        const regSnap = await getDocs(collection(db, 'events', event.id, 'registrations'));
        eventLabels.push(event.title);
        registrationsCount.push(regSnap.size);

        const yearMap = {};
        regSnap.docs.forEach(doc => {
          const { year, section } = doc.data();
          if (!year) return;
          const label = `${year} - ${section || 'No Section'}`;
          yearMap[label] = (yearMap[label] || 0) + 1;
        });

        yearBreakdown[event.title] = yearMap;
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

      setYearSectionData(yearBreakdown);

      // ✅ Find the upcoming event (nearest future date)
      const upcoming = events
        .filter(e => dayjs(e.date).isAfter(dayjs()))
        .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))[0];

      setUpcomingEvent(upcoming || null);
    };

    fetchData();
  }, []);

  return (
    <div>
      <div className="dashboard-cards">
        <Row gutter={[16, 16]}>
          <Col>
            <Card bordered style={{ background: '#D6F5E3' }}>
              <ShoppingOutlined style={{ fontSize: 28 }} />
              <h2>{eventCount}</h2>
              <p>Total Events</p>
            </Card>
          </Col>

          <Col>
            <Card bordered style={{ background: '#FFF7E6' }}>
              <BarChartOutlined style={{ fontSize: 28 }} />
              <h2>{upcomingEvent?.title || 'N/A'}</h2>
              <p>Upcoming Event</p>
            </Card>
          </Col>
        </Row>
      </div>

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
              <>
                <Bar data={chartData} />
{/* 
                <div style={{ marginTop: 40 }}>
                  {chartData.labels.map(title => (
                    <div key={title} style={{ marginBottom: 24 }}>
                      <h4>{title}</h4>
                      {yearSectionData[title] ? (
                        <ul>
                          {Object.entries(yearSectionData[title]).map(([key, count]) => (
                            <li key={key}>
                              {key}: {count}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No registration breakdown data.</p>
                      )}
                    </div>
                  ))}
                </div> */}
              </>
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
