// LayoutMain.js
import React, { useState } from 'react';
import { LogoutOutlined, FormOutlined, CalendarOutlined } from '@ant-design/icons';
import { Layout, Menu, theme } from 'antd';
import Form from './Form'; // Import the form component
import AdminEvents from './AdminEvents';

const { Header, Content, Footer, Sider } = Layout;

const items = [
  {
    key: '1',
    icon: React.createElement(FormOutlined),
    label: 'Form',
  },
  {
    key: '2',
    icon: React.createElement(CalendarOutlined),
    label: 'Events',
  },
  {
    key: '3',
    icon: React.createElement(LogoutOutlined),
    label: 'Sign Out',
  },
];

const LayoutMain = () => {
  const [selectedKey, setSelectedKey] = useState('2');
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleMenuClick = (e) => {
    setSelectedKey(e.key);
  };

const renderContent = () => {
  if (selectedKey === '1') {
    return <Form />;

  } else if (selectedKey === '2') {
    return <AdminEvents/>;

  } else if (selectedKey === '3') {
    return <div>Signing out...</div>;
  }
  return <div>Select a menu item</div>;
};

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={(broken) => {
          console.log(broken);
        }}
        onCollapse={(collapsed, type) => {
          console.log(collapsed, type);
        }}
      >
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={handleMenuClick}
          items={items}
        />
      </Sider>

      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: '24px 16px 0' }}>
          <div
            style={{
              padding: 24,
              minHeight: 'calc(100vh - 134px)',
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {renderContent()}
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Ant Design ©{new Date().getFullYear()} Created by Ant UED
        </Footer>
      </Layout>
    </Layout>
  );
};

export default LayoutMain;