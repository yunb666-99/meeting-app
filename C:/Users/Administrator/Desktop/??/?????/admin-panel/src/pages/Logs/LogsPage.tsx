import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Select,
  Space,
  Card,
  Typography,
  DatePicker,
  Button,
  Row,
  Col,
  Empty,
  Alert,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '@/core/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface LogRecord {
  id: string;
  time: string;
  adminAccount: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: string;
  ip: string;
}

const ACTION_OPTIONS = [
  { label: '全部', value: '' },
  { label: '创建', value: 'CREATE' },
  { label: '更新', value: 'UPDATE' },
  { label: '删除', value: 'DELETE' },
  { label: '登录', value: 'LOGIN' },
];

const LogsPage: React.FC = () => {
  const [data, setData] = useState<LogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [actionFilter, setActionFilter] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (actionFilter) params.action = actionFilter;
      if (dateRange?.[0]) params.startDate = dateRange[0].format('YYYY-MM-DD');
      if (dateRange?.[1]) params.endDate = dateRange[1].format('YYYY-MM-DD');

      const res = await api.get('/api/admin/logs', { params });
      setData(res.data.data.list || []);
      setTotal(res.data.data.total || 0);
    } catch {
      setError('获取操作日志失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, actionFilter, dateRange]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  const handleReset = () => {
    setActionFilter('');
    setDateRange(null);
    setPage(1);
  };

  const columns: ColumnsType<LogRecord> = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 170,
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    { title: '操作管理员', dataIndex: 'adminAccount', key: 'adminAccount', width: 130 },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 100,
    },
    { title: '目标类型', dataIndex: 'targetType', key: 'targetType', width: 110 },
    { title: '目标ID', dataIndex: 'targetId', key: 'targetId', width: 140 },
    {
      title: '详情',
      dataIndex: 'detail',
      key: 'detail',
      width: 300,
      ellipsis: true,
      render: (val: string) => {
        if (!val) return '-';
        try {
          const parsed = JSON.parse(val);
          return (
            <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify(parsed, null, 2)}
            </pre>
          );
        } catch {
          return val;
        }
      },
    },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 140 },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        操作日志
      </Title>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="操作类型"
              value={actionFilter}
              onChange={(val) => setActionFilter(val)}
              options={ACTION_OPTIONS}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              value={dateRange as [dayjs.Dayjs, dayjs.Dayjs] | null}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
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
          locale={{ emptyText: <Empty description="暂无操作日志" /> }}
          scroll={{ x: 1200 }}
          expandable={{
            expandedRowRender: (record) => {
              if (!record.detail) return <Empty description="无详情" />;
              try {
                const parsed = JSON.parse(record.detail);
                return (
                  <pre
                    style={{
                      margin: 0,
                      padding: 12,
                      fontSize: 12,
                      background: '#f5f5f5',
                      borderRadius: 4,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {JSON.stringify(parsed, null, 2)}
                  </pre>
                );
              } catch {
                return (
                  <pre style={{ margin: 0, padding: 12, fontSize: 12 }}>{record.detail}</pre>
                );
              }
            },
            rowExpandable: (record) => !!record.detail,
          }}
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
    </div>
  );
};

export default LogsPage;
