import React, { useEffect, useState, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Typography,
  Skeleton,
  Tag,
  Empty,
  Alert,
} from 'antd';
import {
  TeamOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import api from '@/core/api';
import { AppColors } from '@/core/constants';
import dayjs from 'dayjs';

const { Title } = Typography;

interface OverviewStats {
  totalUsers: number;
  ongoingMeetings: number;
  todayMeetings: number;
  todayDuration: number;
}

interface RecentMeeting {
  id: string;
  meetingNumber: string;
  hostName: string;
  participantCount: number;
  startTime: string;
  status: string;
}

interface UserTrendItem {
  date: string;
  count: number;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [recentMeetings, setRecentMeetings] = useState<RecentMeeting[]>([]);
  const [userTrend, setUserTrend] = useState<UserTrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statsRes = await api.get('/api/admin/stats/overview');
      setStats(statsRes.data.data);
    } catch {
      setError('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMeetings = useCallback(async () => {
    setMeetingsLoading(true);
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const meetingRes = await api.get('/api/admin/meetings', {
        params: { page: 1, pageSize: 10 },
      });
      setRecentMeetings(meetingRes.data.data.list || []);
    } catch {
      // silently fail for secondary data
    } finally {
      setMeetingsLoading(false);
    }
  }, []);

  const fetchUserTrend = useCallback(async () => {
    try {
      const endDate = dayjs().format('YYYY-MM-DD');
      const startDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
      const res = await api.get('/api/admin/stats/users', {
        params: { from: startDate, to: endDate },
      });
      const data = res.data.data;
      if (Array.isArray(data)) {
        setUserTrend(data);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchMeetings();
    fetchUserTrend();
  }, [fetchData, fetchMeetings, fetchUserTrend]);

  const meetingColumns = [
    { title: '会议号', dataIndex: 'meetingNumber', key: 'meetingNumber' },
    { title: '主持人', dataIndex: 'hostName', key: 'hostName' },
    {
      title: '参与人数',
      dataIndex: 'participantCount',
      key: 'participantCount',
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => {
        if (val === 'ongoing') return <Tag color="green">进行中</Tag>;
        return <Tag>已结束</Tag>;
      },
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        仪表盘
      </Title>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <Statistic
                title="总用户数"
                value={stats?.totalUsers ?? 0}
                prefix={<TeamOutlined style={{ color: AppColors.primaryBlue }} />}
                valueStyle={{ color: AppColors.primaryBlue }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <Statistic
                title="进行中会议"
                value={stats?.ongoingMeetings ?? 0}
                prefix={<VideoCameraOutlined style={{ color: AppColors.green }} />}
                valueStyle={{ color: AppColors.green }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <Statistic
                title="今日会议数"
                value={stats?.todayMeetings ?? 0}
                prefix={<CalendarOutlined style={{ color: AppColors.orange }} />}
                valueStyle={{ color: AppColors.orange }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <Statistic
                title="今日会议总时长"
                value={stats?.todayDuration ?? 0}
                suffix="分钟"
                prefix={<ClockCircleOutlined style={{ color: AppColors.purple }} />}
                valueStyle={{ color: AppColors.purple }}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="最近会议">
            {meetingsLoading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : recentMeetings.length === 0 ? (
              <Empty description="暂无会议记录" />
            ) : (
              <Table
                columns={meetingColumns}
                dataSource={recentMeetings}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ x: 500 }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="用户增长趋势">
            {userTrend.length === 0 ? (
              <Empty description="暂无数据" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={AppColors.primaryBlue}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    name="新用户数"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
