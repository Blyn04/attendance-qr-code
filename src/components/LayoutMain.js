// LayoutMain.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogoutOutlined,
  FormOutlined,
  CalendarOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { Layout, Menu, theme } from 'antd';
import AdminEvents from './AdminEvents';
import AdminEventForms from './AdminEventForms';

const { Header, Content, Footer, Sider } = Layout;

const items = [
  {
    key: '1',
    icon: React.createElement(FormOutlined),
    label: 'Registration Form',
  },
  {
    key: '2',
    icon: React.createElement(CalendarOutlined),
    label: 'Events',
  },
  {
    key: '4',
    icon: React.createElement(EditOutlined),
    label: 'Manage Forms',
  },
  {
    key: '3',
    icon: React.createElement(LogoutOutlined),
    label: 'Sign Out',
  },
];

const LayoutMain = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Determine selected key based on current path
  const getSelectedKey = () => {
    if (location.pathname.startsWith('/form')) return '1';
    if (location.pathname.startsWith('/admin/manage-forms')) return '4';
    if (location.pathname.startsWith('/events')) return '2';
    return '2'; // default to Events
  };

  const selectedKey = getSelectedKey();

  const handleMenuClick = (e) => {
    if (e.key === '1') {
      navigate('/form/sample-event-id'); 

    } else if (e.key === '2') {
      navigate('/events');

    } else if (e.key === '4') {
      navigate('/admin/manage-forms');
      
    } else if (e.key === '3') {
      console.log('Logging out...');
    }
  };

  const renderContent = () => {
    if (selectedKey === '1') {
      return <div>Registration Form (Coming Soon)</div>; // or use a placeholder

    } else if (selectedKey === '2') {
      return <AdminEvents />;

    } else if (selectedKey === '4') {
      return <AdminEventForms />;  

    } else if (selectedKey === '3') {
      return <div>Signing out...</div>;
    }
    return <div>Select a menu item</div>;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
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
          Created by Blyn
        </Footer>
      </Layout>
    </Layout>
  );
};

export default LayoutMain;
