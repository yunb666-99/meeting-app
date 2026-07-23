import '../api_client.dart';
import '../models/meeting.dart';
import '../models/chat_message.dart';

class MeetingRepository {
  final ApiClient _apiClient = ApiClient();

  /// 解析标准响应格式
  dynamic _parseResponse(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      if (responseData['code'] != null &&
          responseData['code'] != 200 &&
          responseData['code'] != 201) {
        throw Exception(
            responseData['message']?.toString() ?? '请求失败');
      }
      return responseData['data'];
    }
    return responseData;
  }

  /// 创建会议
  Future<Meeting> createMeeting({String? title}) async {
    try {
      final response = await _apiClient.dio.post('/meetings', data: {
        if (title != null) 'title': title,
      });
      final data = _parseResponse(response.data);
      return Meeting.fromJson(data);
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('创建会议失败');
    }
  }

  /// 以访客身份加入会议
  Future<Map<String, dynamic>> joinAsGuest(
      String meetingId, String password, String nickname) async {
    try {
      final response = await _apiClient.dio.post('/meetings/join', data: {
        'meetingId': meetingId,
        'password': password,
        'nickname': nickname,
      });
      final data = _parseResponse(response.data);
      return data;
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('加入会议失败');
    }
  }

  /// 获取 LiveKit Token
  Future<Map<String, String>> getMeetingToken(String meetingId) async {
    try {
      final response =
          await _apiClient.dio.post('/meetings/$meetingId/token');
      final data = _parseResponse(response.data);
      return {
        'livekitToken': data['livekitToken'] ?? '',
        'livekitUrl': data['livekitUrl'] ?? '',
      };
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('获取会议令牌失败');
    }
  }

  /// 获取单个会议信息
  Future<Meeting> getMeeting(String id) async {
    try {
      final response = await _apiClient.dio.get('/meetings/$id');
      final data = _parseResponse(response.data);
      return Meeting.fromJson(data);
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('获取会议信息失败');
    }
  }

  /// 获取我的会议列表
  Future<Map<String, dynamic>> getMyMeetings({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiClient.dio.get('/meetings/my',
          queryParameters: {'page': page, 'limit': limit});
      final data = _parseResponse(response.data);
      final list = (data['list'] as List<dynamic>?)
              ?.map((e) => Meeting.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [];
      return {
        'list': list,
        'total': data['total'] ?? 0,
        'page': data['page'] ?? page,
        'limit': data['limit'] ?? limit,
      };
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('获取会议列表失败');
    }
  }

  /// 获取参会人员列表
  Future<List<Map<String, dynamic>>> getParticipants(
      String meetingId) async {
    try {
      final response =
          await _apiClient.dio.get('/meetings/$meetingId/participants');
      final data = _parseResponse(response.data);
      if (data is List) {
        return data
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
      }
      return [];
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('获取参会人员失败');
    }
  }

  /// 结束会议
  Future<void> endMeeting(String meetingId) async {
    try {
      await _apiClient.dio.post('/meetings/$meetingId/end');
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('结束会议失败');
    }
  }

  /// 踢出参会者
  Future<void> kickParticipant(
      String meetingId, String identity) async {
    try {
      await _apiClient.dio.post('/meetings/$meetingId/kick', data: {
        'identity': identity,
      });
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('踢出参会者失败');
    }
  }

  /// 全体静音
  Future<void> muteAll(String meetingId) async {
    try {
      await _apiClient.dio.post('/meetings/$meetingId/mute-all');
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('全体静音失败');
    }
  }

  /// 获取聊天记录
  Future<List<ChatMessage>> getChatHistory(
    String meetingId, {
    String? before,
    int limit = 50,
  }) async {
    try {
      final queryParams = <String, dynamic>{'limit': limit};
      if (before != null) queryParams['before'] = before;

      final response = await _apiClient.dio.get(
          '/meetings/$meetingId/chat',
          queryParameters: queryParams);
      final data = _parseResponse(response.data);
      if (data is List) {
        return data
            .map((e) =>
                ChatMessage.fromJson(e as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('获取聊天记录失败');
    }
  }
}
