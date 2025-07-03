import React from 'react';
import { Layout, Typography } from 'antd';

const { Header } = Layout;
const { Title } = Typography;

const CustomHeader = ({ title }) => {
  return (
    <Header
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 64,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      }}
    >
      <Title level={4} style={{ margin: 0 }}>
        {title}
      </Title>
    </Header>
  );
};

export default CustomHeader;
