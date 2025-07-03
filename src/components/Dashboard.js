import React from 'react';
import { Card, Col, Row, Tabs } from 'antd';
import {
  FileOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  ProfileOutlined
} from '@ant-design/icons';
import CustomDashboardCalendar from '../customs/CustomDashboardCalendar'; 

const { TabPane } = Tabs;

const Dashboard = () => {
  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card bordered style={{ background: '#E4F0F5' }}>
            <FileOutlined style={{ fontSize: 28 }} />
            <h2>3</h2>
            <p>Pending Requests</p>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered style={{ background: '#D6F5E3' }}>
            <ShoppingOutlined style={{ fontSize: 28 }} />
            <h2>95</h2>
            <p>Borrow Catalog</p>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered style={{ background: '#C7E5F9' }}>
            <AppstoreOutlined style={{ fontSize: 28 }} />
            <h2>54</h2>
            <p>Inventory</p>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered style={{ background: '#FBE1E4' }}>
            <ProfileOutlined style={{ fontSize: 28 }} />
            <h2>127</h2>
            <p>Request Log</p>
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
