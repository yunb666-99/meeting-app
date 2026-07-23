import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants.dart';
import '../../../data/models/user.dart';
import '../providers/admin_provider.dart';

class UserManagementScreen extends ConsumerStatefulWidget {
  const UserManagementScreen({super.key});

  @override
  ConsumerState<UserManagementScreen> createState() =>
      _UserManagementScreenState();
}

class _UserManagementScreenState
    extends ConsumerState<UserManagementScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(adminProvider.notifier).loadUsers();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearch(String value) {
    setState(() => _searchQuery = value);
    ref.read(adminProvider.notifier).loadUsers(
          search: value.isNotEmpty ? value : null,
        );
  }

  void _showCreateDialog() {
    showDialog(
      context: context,
      builder: (ctx) => const _CreateUserDialog(),
    ).then((_) {
      // 刷新列表
      ref.read(adminProvider.notifier).loadUsers();
    });
  }

  void _showUserActions(User user) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // 用户信息
              ListTile(
                leading: CircleAvatar(
                  backgroundColor: const Color(AppColors.primaryBlue),
                  child: Text(
                    user.nickname.isNotEmpty
                        ? user.nickname[0].toUpperCase()
                        : '?',
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
                title: Text(user.nickname),
                subtitle: Text(user.account),
              ),
              const Divider(),
              // 操作列表
              ListTile(
                leading: const Icon(Icons.edit_outlined,
                    color: Color(AppColors.primaryBlue)),
                title: const Text('编辑信息'),
                onTap: () {
                  Navigator.of(ctx).pop();
                  _showEditDialog(user);
                },
              ),
              ListTile(
                leading: Icon(
                  user.isActive ? Icons.block : Icons.check_circle_outline,
                  color: user.isActive
                      ? const Color(AppColors.warning)
                      : const Color(AppColors.success),
                ),
                title: Text(user.isActive ? '禁用账号' : '启用账号'),
                onTap: () {
                  Navigator.of(ctx).pop();
                  _toggleUserStatus(user);
                },
              ),
              ListTile(
                leading: const Icon(Icons.delete_outline,
                    color: Color(AppColors.error)),
                title: const Text('删除用户',
                    style: TextStyle(color: Color(AppColors.error))),
                onTap: () {
                  Navigator.of(ctx).pop();
                  _confirmDelete(user);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showEditDialog(User user) {
    final nicknameController = TextEditingController(text: user.nickname);
    String selectedRole = user.role;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('编辑用户'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nicknameController,
                decoration: const InputDecoration(
                  labelText: '昵称',
                  hintText: '请输入昵称',
                ),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: selectedRole,
                decoration: const InputDecoration(
                  labelText: '角色',
                ),
                items: const [
                  DropdownMenuItem(value: 'USER', child: Text('普通用户')),
                  DropdownMenuItem(value: 'ADMIN', child: Text('管理员')),
                ],
                onChanged: (val) {
                  if (val != null) {
                    setDialogState(() => selectedRole = val);
                  }
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('取消'),
            ),
            ElevatedButton(
              onPressed: () async {
                final notifier = ref.read(adminProvider.notifier);
                final success = await notifier.updateUser(user.id, {
                  'nickname': nicknameController.text.trim(),
                  'role': selectedRole,
                });
                if (ctx.mounted) {
                  Navigator.of(ctx).pop();
                  if (success && mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('更新成功'),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  }
                }
              },
              child: const Text('保存'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _toggleUserStatus(User user) async {
    final notifier = ref.read(adminProvider.notifier);
    final success = await notifier.updateUser(user.id, {
      'isActive': !user.isActive,
    });
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(user.isActive ? '已禁用' : '已启用'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _confirmDelete(User user) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('确认删除'),
        content: Text('确定要删除用户 "${user.nickname}" 吗？此操作不可撤销。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('删除',
                style: TextStyle(color: Color(AppColors.error))),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final notifier = ref.read(adminProvider.notifier);
      final success = await notifier.deleteUser(user.id);
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('删除成功'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final adminState = ref.watch(adminProvider);
    final users = adminState.users;
    final isLoading = adminState.isLoading;

    // 监听错误
    ref.listen<AdminState>(adminProvider, (previous, next) {
      if (next.error != null && next.error!.isNotEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.error!),
            backgroundColor: const Color(AppColors.error),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8)),
          ),
        );
        ref.read(adminProvider.notifier).clearError();
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('用户管理'),
      ),
      body: Column(
        children: [
          // 搜索栏
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchController,
              onChanged: _onSearch,
              decoration: InputDecoration(
                hintText: '搜索用户（账号/昵称）',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _onSearch('');
                        },
                      )
                    : null,
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 12),
              ),
            ),
          ),

          // 用户总数
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Text(
                  '共 ${adminState.total} 个用户',
                  style: const TextStyle(
                    color: Color(AppColors.textSecondary),
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 8),

          // 用户列表
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : users.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.people_outline,
                                size: 64, color: Color(AppColors.textHint)),
                            const SizedBox(height: 12),
                            const Text(
                              '暂无用户',
                              style: TextStyle(
                                  color: Color(AppColors.textHint)),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () =>
                            ref.read(adminProvider.notifier).loadUsers(),
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          itemCount: users.length,
                          itemBuilder: (context, index) {
                            final user = users[index];
                            return _UserListTile(
                              user: user,
                              onTap: () => _showUserActions(user),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateDialog,
        backgroundColor: const Color(AppColors.primaryBlue),
        child: const Icon(Icons.person_add, color: Colors.white),
      ),
    );
  }
}

/// 用户列表项
class _UserListTile extends StatelessWidget {
  final User user;
  final VoidCallback onTap;

  const _UserListTile({required this.user, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: user.isActive
              ? const Color(AppColors.primaryBlue)
              : const Color(AppColors.textHint),
          child: Text(
            user.nickname.isNotEmpty
                ? user.nickname[0].toUpperCase()
                : '?',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
          ),
        ),
        title: Row(
          children: [
            Flexible(
              child: Text(
                user.nickname,
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            // 角色标签
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: user.isAdmin
                    ? const Color(AppColors.warning).withOpacity(0.15)
                    : const Color(AppColors.primaryBlue).withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                user.isAdmin ? '管理员' : '用户',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: user.isAdmin
                      ? const Color(AppColors.warning)
                      : const Color(AppColors.primaryBlue),
                ),
              ),
            ),
          ],
        ),
        subtitle: Text(
          user.account,
          style: const TextStyle(
              fontSize: 13, color: Color(AppColors.textSecondary)),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            // 状态指示器
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: user.isActive
                    ? const Color(AppColors.success)
                    : const Color(AppColors.textHint),
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.chevron_right,
                color: Color(AppColors.textHint)),
          ],
        ),
        onTap: onTap,
      ),
    );
  }
}

/// 创建用户对话框
class _CreateUserDialog extends ConsumerStatefulWidget {
  const _CreateUserDialog();

  @override
  ConsumerState<_CreateUserDialog> createState() =>
      _CreateUserDialogState();
}

class _CreateUserDialogState extends ConsumerState<_CreateUserDialog> {
  final _formKey = GlobalKey<FormState>();
  final _accountController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nicknameController = TextEditingController();
  String _selectedRole = 'USER';
  bool _isLoading = false;

  @override
  void dispose() {
    _accountController.dispose();
    _passwordController.dispose();
    _nicknameController.dispose();
    super.dispose();
  }

  Future<void> _handleCreate() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final notifier = ref.read(adminProvider.notifier);
    final success = await notifier.createUser(
      account: _accountController.text.trim(),
      password: _passwordController.text,
      nickname: _nicknameController.text.trim(),
      role: _selectedRole,
    );

    if (!mounted) return;

    if (success) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('创建成功'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(ref.read(adminProvider).error ?? '创建失败'),
          backgroundColor: const Color(AppColors.error),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('创建用户'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _accountController,
                decoration: const InputDecoration(
                  labelText: '账号',
                  hintText: '请输入账号',
                ),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? '请输入账号' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _passwordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: '密码',
                  hintText: '请输入密码',
                ),
                validator: (v) =>
                    v == null || v.length < 6 ? '密码至少6位' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _nicknameController,
                decoration: const InputDecoration(
                  labelText: '昵称',
                  hintText: '请输入昵称',
                ),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? '请输入昵称' : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedRole,
                decoration: const InputDecoration(
                  labelText: '角色',
                ),
                items: const [
                  DropdownMenuItem(
                      value: 'USER', child: Text('普通用户')),
                  DropdownMenuItem(
                      value: 'ADMIN', child: Text('管理员')),
                ],
                onChanged: (val) {
                  if (val != null) {
                    setState(() => _selectedRole = val);
                  }
                },
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed:
              _isLoading ? null : () => Navigator.of(context).pop(),
          child: const Text('取消'),
        ),
        ElevatedButton(
          onPressed: _isLoading ? null : _handleCreate,
          child: _isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : const Text('创建'),
        ),
      ],
    );
  }
}
