import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/api_client.dart';
import '../../../data/models/user.dart';
import '../../../data/repositories/auth_repository.dart';

/// 认证状态
class AuthState {
  final bool isLoggedIn;
  final User? user;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.isLoggedIn = false,
    this.user,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    bool? isLoggedIn,
    User? user,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return AuthState(
      isLoggedIn: isLoggedIn ?? this.isLoggedIn,
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

/// 认证状态管理
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _authRepository = AuthRepository();
  final ApiClient _apiClient = ApiClient();

  AuthNotifier() : super(const AuthState());

  /// 登录
  Future<bool> login(String account, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final result =
          await _authRepository.login(account, password);

      final accessToken = result['accessToken'] as String;
      final refreshToken = result['refreshToken'] as String;
      final user = result['user'] as User;

      await _apiClient.saveTokens(accessToken, refreshToken);

      state = state.copyWith(
        isLoggedIn: true,
        user: user,
        isLoading: false,
        clearError: true,
      );

      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
      return false;
    }
  }

  /// 退出登录
  Future<void> logout() async {
    try {
      await _authRepository.logout();
    } catch (_) {
      // 即使后端请求失败也清除本地状态
    } finally {
      await _apiClient.clearTokens();
      state = const AuthState();
    }
  }

  /// 检查认证状态（从存储的 Token 恢复会话）
  Future<void> checkAuth() async {
    final token = await _apiClient.getAccessToken();
    if (token == null || token.isEmpty) {
      state = const AuthState();
      return;
    }

    state = state.copyWith(isLoading: true);

    try {
      final user = await _authRepository.getProfile();
      state = state.copyWith(
        isLoggedIn: true,
        user: user,
        isLoading: false,
        clearError: true,
      );
    } catch (e) {
      await _apiClient.clearTokens();
      state = const AuthState();
    }
  }

  /// 修改密码
  Future<bool> changePassword(
      String oldPassword, String newPassword) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      await _authRepository.changePassword(
          oldPassword, newPassword);
      state = state.copyWith(
          isLoading: false, clearError: true);
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
      return false;
    }
  }
}

/// Provider：认证状态
final authProvider =
    StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});

/// Provider：当前用户
final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(authProvider).user;
});
