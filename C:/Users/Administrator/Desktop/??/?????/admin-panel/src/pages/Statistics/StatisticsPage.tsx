import React, { useEffect, useState, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  DatePicker,
  Button,
  Space,
  Empty,
  Skeleton,
  Alert,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '@/core/api';
import { AppColors, CHART_COLORS } from '@/core/constants';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface MeetingStat {
  date: string;
  count: number;
}

interface UserStat {
  date: string;
  count: number;
}

interface DurationStat {
  name: string;
  value: number;
}

const StatisticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);
  const [meetingStats, setMeetingStats] = useState<MeetingStat[]>([]);
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [durationStats, setDurationStats] = useState<DurationStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = dateRange?.[0] ? dateRange[0].format('YYYY-MM-DD') : dayjs().subtract(7, 'day').format('YYYY-MM-DD');
      const to = dateRange?.[1] ? dateRange[1].format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');

      const [meetingRes, userRes] = await Promise.all([
        api.get('/api/admin/stats/meetings', { params: { from, to, granularity: 'day' } }),
        api.get('/api/admin/stats/users', { params: { from, to } }),
      ]);

      const meetingsData = meetingRes.data.data;
      if (Array.isArray(meetingsData)) {
        setMeetingStats(meetingsData.map((item: { date: string; count: number }) => ({
          date: item.date,
          会议数: item.count,
        })));
      }

      const usersData = userRes.data.data;
      if (Array.isArray(usersData)) {
        setUserStats(usersData.map((item: { date: string; count: number }) => ({
          date: item.date,
          新用户: item.count,
        })));
      }

      // Build duration distribution from meeting data
      if (Array.isArray(meetingsData)) {
        const dist: DurationStat[] = [];
        let shortCount = 0;   // < 30 min
        let mediumCount = 0;  // 30-60 min
        let longCount = 0;    // 1-2 hours
        let veryLongCount = 0; // > 2 hours

        meetingsData.forEach((item: { duration?: number }) => {
          const d = item.duration || 0;
          if (d < 30) shortCount++;
          else if (d < 60) mediumCount++;
          else if (d < 120) longCount++;
          else veryLongCount++;
        });

        if (shortCount > 0) dist.push({ name: '小于30分钟', value: shortCount });
        if (mediumCount > 0) dist.push({ name: '30-60分钟', value: mediumCount });
        if (longCount > 0) dist.push({ name: '1-2小时', value: longCount });
        if (veryLongCount > 0) dist.push({ name: '大于2小时', value: veryLongCount });
        setDurationStats(dist);
      }
    } catch {
      setError('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        数据统计
      </Title>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <RangePicker
            value={dateRange as [dayjs.Dayjs, dayjs.Dayjs] | null}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
            placeholder={['开始日期', '结束日期']}
          />
          <Button type="primary" onClick={fetchStats} loading={loading}>
            查询
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setDateRange([dayjs().subtract(7, 'day'), dayjs()]); }}>
            重置
          </Button>
        </Space>
      </Card>

      {error && (
        <Alert message={error} type="error" showIcon closable style={{ marginBottom: 16 }} />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="每日会议数">
            {loading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : meetingStats.length === 0 ? (
              <Empty description="暂无数据" style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={meetingStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="会议数" fill={AppColors.primaryBlue} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="每日新增用户">
            {loading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : userStats.length === 0 ? (
              <Empty description="暂无数据" style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={userStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="新用户"
                    stroke={AppColors.green}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="会议时长分布">
            {loading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : durationStats.length === 0 ? (
              <Empty description="暂无数据" style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={durationStats}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={40}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {durationStats.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StatisticsPage;
