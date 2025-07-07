import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogoutOutlined,
  FormOutlined,
  CalendarOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { Layout, Menu, theme, Modal, Button } from 'antd';
import AdminEvents from './AdminEvents';
import AdminEventForms from './AdminEventForms';
import Dashboard from './Dashboard';
import CustomHeader from '../customs/CustomHeader';
import jpcsLogo from '../assets/jpcs.png';
import { signOut } from 'firebase/auth';
import { auth } from '../config/FirebaseConfig';
import '../styles/LayoutMain.css';

const { Content, Footer, Sider } = Layout;

const items = [
  {
    key: '0',
    icon: React.createElement(FormOutlined),
    label: 'Dashboard',
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
  const [logoutVisible, setLogoutVisible] = useState(false); // ✅ custom modal state

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const getSelectedKey = () => {
    if (location.pathname === '/dashboard') return '0';
    if (location.pathname.startsWith('/admin/manage-forms')) return '4';
    if (location.pathname.startsWith('/events')) return '2';
    return '0';
  };

  const selectedKey = getSelectedKey();
  const currentTitle = items.find(item => item.key === selectedKey)?.label || 'Dashboard';

  const handleMenuClick = async (e) => {
    if (e.key === '0') {
      navigate('/dashboard');
    } else if (e.key === '2') {
      navigate('/events');
    } else if (e.key === '4') {
      navigate('/admin/manage-forms');
    } else if (e.key === '3') {
      setLogoutVisible(true); // ✅ open modal
    }
  };

  const confirmLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setLogoutVisible(false);
    }
  };

  const renderContent = () => {
    if (selectedKey === '0') return <Dashboard />;
    if (selectedKey === '2') return <AdminEvents />;
    if (selectedKey === '4') return <AdminEventForms />;
    return <div>Select a menu item</div>;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Fixed Sidebar */}
      <Sider
        width={200}
        breakpoint="lg"
        collapsedWidth="0"
        style={{
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          zIndex: 1000,
        }}
      >
        <div className="sidebar-logo">
          <img src={jpcsLogo} alt="JPCS Logo" />
          <div className="logo-text">JPCS - NU MOA</div>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={handleMenuClick}
          items={items}
        />
      </Sider>

      {/* Content area shifted by sidebar width */}
      <Layout style={{ marginLeft: 200 }}>
        {/* Fixed Header */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 200,
            right: 0,
            zIndex: 999,
            background: colorBgContainer,
          }}
        >
          <CustomHeader title={currentTitle} />
        </div>

        {/* Content below fixed header */}
        <Content style={{ marginTop: 64, padding: '24px 16px 0' }}>
          <div
            className="fade-in"
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

      {/* ✅ Custom Logout Modal */}
      <Modal
        title="Confirm Logout"
        open={logoutVisible}
        onOk={confirmLogout}
        onCancel={() => setLogoutVisible(false)}
        okText="Logout"
        okButtonProps={{ danger: true }}
        cancelText="Cancel"
        centered
      >
        <p>Are you sure you want to log out?</p>
      </Modal>
    </Layout>
  );
};

export default LayoutMain;
