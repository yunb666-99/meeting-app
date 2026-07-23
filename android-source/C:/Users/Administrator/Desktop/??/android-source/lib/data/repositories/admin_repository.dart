import '../api_client.dart';
import '../models/user.dart';

class AdminRepository {
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

  /// 获取用户列表
  Future<Map<String, dynamic>> getUsers({
    int page = 1,
    int limit = 20,
    String? search,
    String? role,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }
      if (role != null && role.isNotEmpty) {
        queryParams['role'] = role;
      }

      final response = await _apiClient.dio.get('/admin/users',
          queryParameters: queryParams);
      final data = _parseResponse(response.data);
      final list = (data['list'] as List<dynamic>?)
              ?.map((e) => User.fromJson(e as Map<String, dynamic>))
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
      throw Exception('获取用户列表失败');
    }
  }

  /// 创建用户
  Future<User> createUser({
    required String account,
    required String password,
    required String nickname,
    required String role,
  }) async {
    try {
      final response = await _apiClient.dio.post('/admin/users', data: {
        'account': account,
        'password': password,
        'nickname': nickname,
        'role': role,
      });
      final data = _parseResponse(response.data);
      return User.fromJson(data);
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('创建用户失败');
    }
  }

  /// 更新用户
  Future<User> updateUser(
      String id, Map<String, dynamic> updateData) async {
    try {
      final response =
          await _apiClient.dio.patch('/admin/users/$id', data: updateData);
      final data = _parseResponse(response.data);
      return User.fromJson(data);
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('更新用户失败');
    }
  }

  /// 删除用户
  Future<void> deleteUser(String id) async {
    try {
      await _apiClient.dio.delete('/admin/users/$id');
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('删除用户失败');
    }
  }

  /// 获取统计概览
  Future<Map<String, dynamic>> getStatsOverview() async {
    try {
      final response =
          await _apiClient.dio.get('/admin/stats/overview');
      final data = _parseResponse(response.data);
      return Map<String, dynamic>.from(data ?? {});
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('获取统计数据失败');
    }
  }
}
