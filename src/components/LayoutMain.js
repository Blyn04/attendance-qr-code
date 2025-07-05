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
import Dashboard from './Dashboard';
import CustomHeader from '../customs/CustomHeader';
import jpcsLogo from '../assets/jpcs.png'; 
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

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const getSelectedKey = () => {
    if (location.pathname === '/' || location.pathname === '/dashboard') return '0';
    if (location.pathname.startsWith('/form')) return '1';
    if (location.pathname.startsWith('/admin/manage-forms')) return '4';
    if (location.pathname.startsWith('/events')) return '2';
    return '0';
  };

  const selectedKey = getSelectedKey();
  const currentTitle = items.find(item => item.key === selectedKey)?.label || 'Dashboard';

  const handleMenuClick = (e) => {
    if (e.key === '0') {
      navigate('/');
    } else if (e.key === '2') {
      navigate('/events');
    } else if (e.key === '4') {
      navigate('/admin/manage-forms');
    } else if (e.key === '3') {
      console.log('Logging out...');
    }
  };

  const renderContent = () => {
    if (selectedKey === '0') return <Dashboard />;
    if (selectedKey === '2') return <AdminEvents />;
    if (selectedKey === '4') return <AdminEventForms />;
    if (selectedKey === '3') return <div>Signing out...</div>;
    return <div>Select a menu item</div>;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        {/* ✅ Logo container */}
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

      <Layout>
        <CustomHeader title={currentTitle} />

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
