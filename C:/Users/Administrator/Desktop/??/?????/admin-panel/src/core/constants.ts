export const AppColors = {
  primaryBlue: '#1677ff',
  blue1: '#e6f4ff',
  blue2: '#bae0ff',
  blue3: '#91caff',
  blue4: '#69b1ff',
  blue5: '#4096ff',
  blue6: '#1677ff',
  blue7: '#0958d9',
  blue8: '#003eb3',
  blue9: '#002c8c',
  blue10: '#001d66',
  green: '#52c41a',
  orange: '#fa8c16',
  purple: '#722ed1',
  red: '#f5222d',
};

export const CHART_COLORS = [
  AppColors.primaryBlue,
  AppColors.green,
  AppColors.orange,
  AppColors.purple,
  AppColors.blue8,
  AppColors.blue4,
  AppColors.red,
];

export const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: '禁用', color: 'red' },
  1: { label: '启用', color: 'green' },
};

export const MEETING_STATUS_MAP: Record<string, { label: string; color: string }> = {
  ongoing: { label: '进行中', color: 'green' },
  ended: { label: '已结束', color: 'default' },
};
