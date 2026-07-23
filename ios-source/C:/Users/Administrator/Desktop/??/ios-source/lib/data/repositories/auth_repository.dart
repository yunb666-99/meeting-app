import 'dart:convert';
import '../api_client.dart';
import '../models/user.dart';

class AuthRepository {
  final ApiClient _apiClient = ApiClient();

  /// 解析标准响应格式 { code, message, data }
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

  /// 登录
  Future<Map<String, dynamic>> login(
      String account, String password) async {
    try {
      final response = await _apiClient.dio.post('/auth/login', data: {
        'account': account,
        'password': password,
      });
      final data = _parseResponse(response.data);
      return {
        'accessToken': data['accessToken'],
        'refreshToken': data['refreshToken'],
        'user': User.fromJson(data['user']),
      };
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('登录失败，请检查网络连接');
    }
  }

  /// 刷新 Token
  Future<Map<String, String>> refreshToken(String refreshToken) async {
    try {
      final response =
          await _apiClient.dio.post('/auth/refresh', data: {
        'refreshToken': refreshToken,
      });
      final data = _parseResponse(response.data);
      return {
        'accessToken': data['accessToken'],
        'refreshToken': data['refreshToken'],
      };
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('令牌刷新失败');
    }
  }

  /// 退出登录
  Future<void> logout() async {
    try {
      await _apiClient.dio.post('/auth/logout');
    } catch (_) {
      // 即使后端返回错误，也清除本地 token
    }
  }

  /// 获取当前用户信息
  Future<User> getProfile() async {
    try {
      final response = await _apiClient.dio.get('/auth/me');
      final data = _parseResponse(response.data);
      return User.fromJson(data);
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('获取用户信息失败');
    }
  }

  /// 修改密码
  Future<void> changePassword(
      String oldPassword, String newPassword) async {
    try {
      await _apiClient.dio.post('/auth/change-password', data: {
        'oldPassword': oldPassword,
        'newPassword': newPassword,
      });
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('修改密码失败');
    }
  }
}
