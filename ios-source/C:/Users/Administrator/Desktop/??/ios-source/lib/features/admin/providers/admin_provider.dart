import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/user.dart';
import '../../../data/repositories/admin_repository.dart';

/// 管理状态
class AdminState {
  final List<User> users;
  final bool isLoading;
  final String? error;
  final int total;
  final int page;
  final int limit;

  const AdminState({
    this.users = const [],
    this.isLoading = false,
    this.error,
    this.total = 0,
    this.page = 1,
    this.limit = 20,
  });

  AdminState copyWith({
    List<User>? users,
    bool? isLoading,
    String? error,
    int? total,
    int? page,
    int? limit,
    bool clearError = false,
  }) {
    return AdminState(
      users: users ?? this.users,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      total: total ?? this.total,
      page: page ?? this.page,
      limit: limit ?? this.limit,
    );
  }
}

/// 管理状态管理
class AdminNotifier extends StateNotifier<AdminState> {
  final AdminRepository _adminRepository = AdminRepository();

  AdminNotifier() : super(const AdminState());

  /// 加载用户列表
  Future<void> loadUsers({
    int page = 1,
    int limit = 20,
    String? search,
    String? role,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final result = await _adminRepository.getUsers(
        page: page,
        limit: limit,
        search: search,
        role: role,
      );

      final list = result['list'] as List<User>;
      final total = result['total'] as int;

      state = state.copyWith(
        users: list,
        total: total,
        page: result['page'] as int? ?? page,
        limit: result['limit'] as int? ?? limit,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  /// 创建用户
  Future<bool> createUser({
    required String account,
    required String password,
    required String nickname,
    required String role,
  }) async {
    try {
      await _adminRepository.createUser(
        account: account,
        password: password,
        nickname: nickname,
        role: role,
      );
      await loadUsers(page: state.page);
      return true;
    } catch (e) {
      state = state.copyWith(
        error: e.toString().replaceFirst('Exception: ', ''),
      );
      return false;
    }
  }

  /// 更新用户
  Future<bool> updateUser(
      String id, Map<String, dynamic> data) async {
    try {
      await _adminRepository.updateUser(id, data);
      await loadUsers(page: state.page);
      return true;
    } catch (e) {
      state = state.copyWith(
        error: e.toString().replaceFirst('Exception: ', ''),
      );
      return false;
    }
  }

  /// 删除用户
  Future<bool> deleteUser(String id) async {
    try {
      await _adminRepository.deleteUser(id);
      await loadUsers(page: state.page);
      return true;
    } catch (e) {
      state = state.copyWith(
        error: e.toString().replaceFirst('Exception: ', ''),
      );
      return false;
    }
  }

  /// 清除错误
  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

/// Provider：管理状态
final adminProvider =
    StateNotifierProvider<AdminNotifier, AdminState>((ref) {
  return AdminNotifier();
});
