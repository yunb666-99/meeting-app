import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/core/auth';

const { Title } = Typography;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const onFinish = async (values: { account: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      await login(values.account, values.password);
      message.success('登录成功');
      navigate('/admin/dashboard', { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('登录失败，请检查账号和密码');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      style={{
        width: 400,
        maxWidth: '90vw',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        borderRadius: 8,
      }}
      styles={{ body: { padding: '40px 32px' } }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          MeetingApp
        </Title>
        <Typography.Text type="secondary">管理后台</Typography.Text>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 24 }}
        />
      )}

      <Form
        name="login"
        size="large"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          name="account"
          rules={[{ required: true, message: '请输入账号' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="账号" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="密码" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={loading} block>
            登录
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default LoginPage;
