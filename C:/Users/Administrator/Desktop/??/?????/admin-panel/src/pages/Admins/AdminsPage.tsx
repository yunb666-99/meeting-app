import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Card,
  Tag,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Empty,
  Alert,
} from 'antd';
import { PlusOutlined, LockOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '@/core/api';
import { STATUS_MAP } from '@/core/constants';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface AdminRecord {
  id: string;
  account: string;
  nickname: string;
  role: string;
  status: number;
  createdAt: string;
}

const PROTECTED_ACCOUNT = '2942146423';

const AdminsPage: React.FC = () => {
  const [data, setData] = useState<AdminRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm] = Form.useForm();

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/admin/users', {
        params: { page, pageSize, role: 'ADMIN' },
      });
      setData(res.data.data.list || []);
      setTotal(res.data.data.total || 0);
    } catch {
      setError('获取管理员列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateLoading(true);
      await api.post('/api/admin/users', { ...values, role: 'ADMIN' });
      message.success('管理员创建成功');
      setCreateOpen(false);
      createForm.resetFields();
      fetchAdmins();
    } catch {
      // validation or API error
    } finally {
      setCreateLoading(false);
    }
  };

  const handlePromote = async (record: AdminRecord) => {
    try {
      await api.patch(`/api/admin/users/${record.id}`, { role: 'ADMIN' });
      message.success('已提升为管理员');
      fetchAdmins();
    } catch {
      // handled by interceptor
    }
  };

  const handleDemote = async (record: AdminRecord) => {
    try {
      await api.patch(`/api/admin/users/${record.id}`, { role: 'USER' });
      message.success('已降级为普通用户');
      fetchAdmins();
    } catch {
      // handled by interceptor
    }
  };

  const handleToggleStatus = async (record: AdminRecord) => {
    const newStatus = record.status === 1 ? 0 : 1;
    try {
      await api.patch(`/api/admin/users/${record.id}`, { status: newStatus });
      message.success(newStatus === 1 ? '管理员已启用' : '管理员已禁用');
      fetchAdmins();
    } catch {
      // handled by interceptor
    }
  };

  const columns: ColumnsType<AdminRecord> = [
    {
      title: '账号',
      dataIndex: 'account',
      key: 'account',
      width: 160,
      render: (account: string) => (
        <Space>
          {account}
          {account === PROTECTED_ACCOUNT && (
            <LockOutlined style={{ color: '#faad14' }} title="初始管理员，不可修改" />
          )}
        </Space>
      ),
    },
    { title: '昵称', dataIndex: 'nickname', key: 'nickname', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: number) => {
        const info = STATUS_MAP[status];
        if (!info) return <Tag>未知</Tag>;
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_: unknown, record: AdminRecord) => {
        const isProtected = record.account === PROTECTED_ACCOUNT;
        return (
          <Space size="small">
            {!isProtected && (
              <>
                <Popconfirm
                  title="确认将该用户降级为普通用户？"
                  onConfirm={() => handleDemote(record)}
                  okText="确认"
                  cancelText="取消"
                >
                  <Button type="link" size="small" danger>
                    降级
                  </Button>
                </Popconfirm>
                <Popconfirm
                  title={record.status === 1 ? '确认禁用该管理员？' : '确认启用该管理员？'}
                  onConfirm={() => handleToggleStatus(record)}
                  okText="确认"
                  cancelText="取消"
                >
                  <Button type="link" size="small" danger={record.status === 1}>
                    {record.status === 1 ? '禁用' : '启用'}
                  </Button>
                </Popconfirm>
              </>
            )}
            {isProtected && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                受保护账号
              </Text>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          管理员管理
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          添加管理员
        </Button>
      </div>

      {error && (
        <Alert message={error} type="error" showIcon closable style={{ marginBottom: 16 }} />
      )}

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: <Empty description="暂无管理员数据" /> }}
          scroll={{ x: 800 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      <Modal
        title="添加管理员"
        open={createOpen}
        onOk={handleCreate}
        onCancel={() => {
          setCreateOpen(false);
          createForm.resetFields();
        }}
        confirmLoading={createLoading}
        okText="创建"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" preserve={false}>
          <Form.Item
            name="account"
            label="账号"
            rules={[
              { required: true, message: '请输入账号' },
              { min: 3, message: '账号至少3个字符' },
            ]}
          >
            <Input placeholder="请输入账号" />
          </Form.Item>
          <Form.Item
            name="nickname"
            label="昵称"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input placeholder="请输入昵称" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item
            name="userId"
            label="关联用户ID"
            rules={[{ required: true, message: '请输入关联用户ID' }]}
          >
            <Input placeholder="输入已有用户ID将其提升为管理员" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminsPage;
