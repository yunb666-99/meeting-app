import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Card,
  Tag,
  Typography,
  Modal,
  Form,
  message,
  Popconfirm,
  Row,
  Col,
  Empty,
  Alert,
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '@/core/api';
import { STATUS_MAP } from '@/core/constants';
import dayjs from 'dayjs';

const { Title } = Typography;

interface UserRecord {
  id: string;
  account: string;
  nickname: string;
  role: string;
  status: number;
  lastLogin: string;
  createdAt: string;
}

interface UserQuery {
  page: number;
  pageSize: number;
  keyword?: string;
  role?: string;
}

const ROLE_OPTIONS = [
  { label: '全部', value: '' },
  { label: '普通用户', value: 'USER' },
  { label: '管理员', value: 'ADMIN' },
];

const UsersPage: React.FC = () => {
  const [data, setData] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<UserQuery>({ page: 1, pageSize: 10 });
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm] = Form.useForm();

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm] = Form.useForm();
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/admin/users', {
        params: {
          page: query.page,
          pageSize: query.pageSize,
          ...(query.keyword ? { keyword: query.keyword } : {}),
          ...(query.role ? { role: query.role } : {}),
        },
      });
      setData(res.data.data.list || []);
      setTotal(res.data.data.total || 0);
    } catch {
      setError('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      keyword,
      role: roleFilter,
    }));
  };

  const handleReset = () => {
    setKeyword('');
    setRoleFilter('');
    setQuery({ page: 1, pageSize: 10 });
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setQuery((prev) => ({ ...prev, page, pageSize }));
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateLoading(true);
      await api.post('/api/admin/users', values);
      message.success('用户创建成功');
      setCreateOpen(false);
      createForm.resetFields();
      fetchUsers();
    } catch {
      // validation error or API error
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingUser) return;
    try {
      const values = await editForm.validateFields();
      setEditLoading(true);
      await api.patch(`/api/admin/users/${editingUser.id}`, values);
      message.success('用户信息更新成功');
      setEditOpen(false);
      setEditingUser(null);
      editForm.resetFields();
      fetchUsers();
    } catch {
      // validation error or API error
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleStatus = async (record: UserRecord) => {
    const newStatus = record.status === 1 ? 0 : 1;
    try {
      await api.patch(`/api/admin/users/${record.id}`, { status: newStatus });
      message.success(newStatus === 1 ? '用户已启用' : '用户已禁用');
      fetchUsers();
    } catch {
      // error handled by interceptor
    }
  };

  const handleResetPassword = async (record: UserRecord) => {
    try {
      await api.post(`/api/admin/users/${record.id}/reset-password`);
      message.success('密码重置成功');
    } catch {
      // error handled by interceptor
    }
  };

  const openEditModal = (record: UserRecord) => {
    setEditingUser(record);
    editForm.setFieldsValue({
      nickname: record.nickname,
      role: record.role,
      status: record.status,
    });
    setEditOpen(true);
  };

  const columns: ColumnsType<UserRecord> = [
    { title: '账号', dataIndex: 'account', key: 'account', width: 140 },
    { title: '昵称', dataIndex: 'nickname', key: 'nickname', width: 120 },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => {
        if (role === 'ADMIN') return <Tag color="red">管理员</Tag>;
        return <Tag color="blue">普通用户</Tag>;
      },
    },
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
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 170,
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'),
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
      width: 240,
      fixed: 'right',
      render: (_: unknown, record: UserRecord) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title={record.status === 1 ? '确认禁用该用户？' : '确认启用该用户？'}
            onConfirm={() => handleToggleStatus(record)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger={record.status === 1}>
              {record.status === 1 ? '禁用' : '启用'}
            </Button>
          </Popconfirm>
          <Popconfirm
            title="确认重置该用户密码？"
            onConfirm={() => handleResetPassword(record)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small">
              重置密码
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          用户管理
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          创建用户
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="搜索账号/昵称"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="角色"
              value={roleFilter}
              onChange={(val) => setRoleFilter(val)}
              options={ROLE_OPTIONS}
              style={{ width: '100%' }}
            />
          </Col>
          <Col>
            <Space>
              <Button type="primary" onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {error && (
        <Alert message={error} type="error" showIcon closable style={{ marginBottom: 16 }} />
      )}

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: <Empty description="暂无用户数据" /> }}
          scroll={{ x: 1000 }}
          pagination={{
            current: query.page,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: handlePageChange,
          }}
        />
      </Card>

      {/* Create User Modal */}
      <Modal
        title="创建用户"
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
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
            initialValue="USER"
          >
            <Select
              options={[
                { label: '普通用户', value: 'USER' },
                { label: '管理员', value: 'ADMIN' },
              ]}
              placeholder="请选择角色"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        title="编辑用户"
        open={editOpen}
        onOk={handleEdit}
        onCancel={() => {
          setEditOpen(false);
          setEditingUser(null);
          editForm.resetFields();
        }}
        confirmLoading={editLoading}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" preserve={false}>
          <Form.Item
            name="nickname"
            label="昵称"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input placeholder="请输入昵称" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select
              options={[
                { label: '普通用户', value: 'USER' },
                { label: '管理员', value: 'ADMIN' },
              ]}
              placeholder="请选择角色"
            />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select
              options={[
                { label: '启用', value: 1 },
                { label: '禁用', value: 0 },
              ]}
              placeholder="请选择状态"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersPage;
