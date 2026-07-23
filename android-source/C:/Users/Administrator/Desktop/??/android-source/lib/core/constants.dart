/// 应用常量配置
class AppConstants {
  AppConstants._();

  /// API 基础地址（部署时修改为实际域名）
  static const String apiBaseUrl = 'https://meeting.example.com/api';

  /// LiveKit WebSocket 地址
  static const String livekitWsUrl = 'wss://meeting.example.com';

  /// WebSocket 地址
  static const String wsUrl = 'https://meeting.example.com';

  /// 应用名称
  static const String appName = 'MeetingApp';

  /// 会议号长度
  static const int meetingIdLength = 8;
}

/// 应用颜色
class AppColors {
  AppColors._();

  /// 主色 - 淡蓝
  static const int primaryBlue = 0xFF5B9BD5;

  /// 主色变体
  static const int primaryLight = 0xFFB4D4F0;
  static const int primaryDark = 0xFF3A7BBF;

  /// 白色
  static const int white = 0xFFFFFFFF;

  /// 背景色
  static const int background = 0xFFF5F9FC;

  /// 文字颜色
  static const int textPrimary = 0xFF1A1A2E;
  static const int textSecondary = 0xFF6B7280;
  static const int textHint = 0xFF9CA3AF;

  /// 功能色
  static const int success = 0xFF10B981;
  static const int warning = 0xFFF59E0B;
  static const int error = 0xFFEF4444;
  static const int info = 0xFF5B9BD5;

  /// 边框和分割线
  static const int border = 0xFFE5E7EB;
  static const int divider = 0xFFF3F4F6;
}
