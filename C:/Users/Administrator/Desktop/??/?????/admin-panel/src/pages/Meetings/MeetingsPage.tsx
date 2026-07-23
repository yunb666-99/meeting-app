import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Select,
  Space,
  Card,
  Tag,
  Typography,
  DatePicker,
  Modal,
  message,
  Popconfirm,
  Row,
  Col,
  Empty,
  Alert,
  Descriptions,
  List,
  Divider,
} from 'antd';
import { ReloadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '@/core/api';
import { MEETING_STATUS_MAP } from '@/core/constants';
import dayjs from 'dayjs';
import type { MeetingDetail } from '@/types/meeting';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface MeetingRecord {
  id: string;
  meetingNumber: string;
  title: string;
  hostName: string;
  participantCount: number;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
}

interface MeetingQuery {
  page: number;
  pageSize: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

const STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '进行中', value: 'ongoing' },
  { label: '已结束', value: 'ended' },
];

const formatDuration = (minutes: number): string => {
  if (!minutes && minutes !== 0) return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}小时${m}分钟`;
  return `${m}分钟`;
};

const MeetingsPage: React.FC = () => {
  const [data, setData] = useState<MeetingRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<MeetingQuery>({ page: 1, pageSize: 10 });
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [meetingDetail, setMeetingDetail] = useState<MeetingDetail | null>(null);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/admin/meetings', {
        params: {
          page: query.page,
          pageSize: query.pageSize,
          ...(query.status ? { status: query.status } : {}),
          ...(query.startDate ? { startDate: query.startDate } : {}),
          ...(query.endDate ? { endDate: query.endDate } : {}),
        },
      });
      setData(res.data.data.list || []);
      setTotal(res.data.data.total || 0);
    } catch {
      setError('获取会议记录失败');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleSearch = () => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      status: statusFilter,
      startDate: dateRange?.[0] ? dateRange[0].format('YYYY-MM-DD') : undefined,
      endDate: dateRange?.[1] ? dateRange[1].format('YYYY-MM-DD') : undefined,
    }));
  };

  const handleReset = () => {
    setStatusFilter('');
    setDateRange(null);
    setQuery({ page: 1, pageSize: 10 });
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setQuery((prev) => ({ ...prev, page, pageSize }));
  };

  const handleViewDetail = async (record: MeetingRecord) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setMeetingDetail(null);
    try {
      const res = await api.get(`/api/admin/meetings/${record.id}`);
      setMeetingDetail(res.data.data);
    } catch {
      message.error('获取会议详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    try {
      await Promise.all(
        selectedRowKeys.map((id) => api.delete(`/api/admin/meetings/${id}`)),
      );
      message.success(`成功删除 ${selectedRowKeys.length} 条记录`);
      setSelectedRowKeys([]);
      fetchMeetings();
    } catch {
      // handled by interceptor
      fetchMeetings();
    }
  };

  const columns: ColumnsType<MeetingRecord> = [
    { title: '会议号', dataIndex: 'meetingNumber', key: 'meetingNumber', width: 130 },
    { title: '标题', dataIndex: 'title', key: 'title', width: 180, ellipsis: true },
    { title: '主持人', dataIndex: 'hostName', key: 'hostName', width: 110 },
    {
      title: '参与人数',
      dataIndex: 'participantCount',
      key: 'participantCount',
      width: 90,
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 170,
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 170,
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '持续时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 110,
      render: (val: number) => formatDuration(val),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (val: string) => {
        const info = MEETING_STATUS_MAP[val];
        if (!info) return <Tag>未知</Tag>;
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_: unknown, record: MeetingRecord) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        会议记录
      </Title>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              value={dateRange as [dayjs.Dayjs, dayjs.Dayjs] | null}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
            />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="状态"
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={STATUS_OPTIONS}
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
        {selectedRowKeys.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Popconfirm
              title={`确认删除选中的 ${selectedRowKeys.length} 条会议记录？`}
              onConfirm={handleBatchDelete}
              okText="确认"
              cancelText="取消"
            >
              <Button danger icon={<DeleteOutlined />}>
                批量删除 ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          </div>
        )}
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: <Empty description="暂无会议记录" /> }}
          scroll={{ x: 1300 }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
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

      {/* Meeting Detail Modal */}
      <Modal
        title="会议详情"
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false);
          setMeetingDetail(null);
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
        ) : !meetingDetail ? (
          <Empty description="暂无数据" />
        ) : (
          <div>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="会议号">{meetingDetail.meetingNumber}</Descriptions.Item>
              <Descriptions.Item label="标题">{meetingDetail.title}</Descriptions.Item>
              <Descriptions.Item label="主持人">{meetingDetail.hostName}</Descriptions.Item>
              <Descriptions.Item label="参与人数">{meetingDetail.participantCount}</Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {meetingDetail.startTime ? dayjs(meetingDetail.startTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="结束时间">
                {meetingDetail.endTime ? dayjs(meetingDetail.endTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="持续时长">{formatDuration(meetingDetail.duration)}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {meetingDetail.status === 'ongoing' ? <Tag color="green">进行中</Tag> : <Tag>已结束</Tag>}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">参会人员</Divider>
            {meetingDetail.participants && meetingDetail.participants.length > 0 ? (
              <Table
                dataSource={meetingDetail.participants}
                rowKey="id"
                size="small"
                pagination={false}
                style={{ marginBottom: 16 }}
                columns={[
                  { title: '用户', dataIndex: 'nickname', key: 'nickname' },
                  {
                    title: '加入时间',
                    dataIndex: 'joinTime',
                    key: 'joinTime',
                    render: (v: string) => (v ? dayjs(v).format('HH:mm:ss') : '-'),
                  },
                  {
                    title: '离开时间',
                    dataIndex: 'leaveTime',
                    key: 'leaveTime',
                    render: (v: string) => (v ? dayjs(v).format('HH:mm:ss') : '-'),
                  },
                ]}
              />
            ) : (
              <Empty description="暂无参会人员" />
            )}

            <Divider orientation="left">聊天记录</Divider>
            {meetingDetail.chatMessages && meetingDetail.chatMessages.length > 0 ? (
              <List
                dataSource={meetingDetail.chatMessages}
                style={{ maxHeight: 300, overflow: 'auto' }}
                renderItem={(msg) => (
                  <List.Item style={{ padding: '8px 0' }}>
                    <div>
                      <Text strong>{msg.nickname}</Text>
                      <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                        {msg.sendTime ? dayjs(msg.sendTime).format('HH:mm:ss') : ''}
                      </Text>
                      <div style={{ marginTop: 4 }}>{msg.content}</div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无聊天记录" />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MeetingsPage;
