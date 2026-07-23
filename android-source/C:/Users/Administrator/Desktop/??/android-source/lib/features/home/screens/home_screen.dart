import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants.dart';
import '../../../data/repositories/meeting_repository.dart';
import '../../../data/models/meeting.dart';
import '../../auth/providers/auth_provider.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final isAdmin = user?.isAdmin ?? false;

    return Scaffold(
      appBar: AppBar(
        title: const Text('MeetingApp'),
        actions: [
          // 用户信息
          if (user != null)
            Padding(
              padding: const EdgeInsets.only(right: 4),
              child: Center(
                child: Text(
                  user.nickname,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          // 退出登录
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: '退出登录',
            onPressed: () async {
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          // 刷新数据
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // 顶部快捷操作卡片
            Row(
              children: [
                Expanded(
                  child: _ActionCard(
                    icon: Icons.video_call_rounded,
                    label: '创建会议',
                    color: const Color(AppColors.primaryBlue),
                    onTap: () => _createMeeting(context, ref),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _ActionCard(
                    icon: Icons.login_rounded,
                    label: '加入会议',
                    color: const Color(AppColors.success),
                    onTap: () => context.push('/join'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // 管理员入口
            if (isAdmin)
              _AdminCard(
                onTap: () => context.push('/admin/users'),
              ),

            const SizedBox(height: 24),

            // 我的会议
            const Text(
              '我的会议',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(AppColors.textPrimary),
              ),
            ),
            const SizedBox(height: 12),

            // 会议列表
            _MeetingList(),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _createMeeting(context, ref),
        backgroundColor: const Color(AppColors.primaryBlue),
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Future<void> _createMeeting(
      BuildContext context, WidgetRef ref) async {
    try {
      final repo = MeetingRepository();
      final meeting = await repo.createMeeting();

      if (!context.mounted) return;

      // 显示创建成功，包含会议密码
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('会议已创建'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('会议信息：'),
              const SizedBox(height: 8),
              Text('会议号: ${meeting.meetingId}'),
              if (meeting.password != null)
                Text('会议密码: ${meeting.password}'),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                context.push('/pre-join/${meeting.meetingId}');
              },
              child: const Text('进入会议'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: const Color(AppColors.error),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8)),
        ),
      );
    }
  }
}

/// 快捷操作卡片
class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionCard({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 40, color: color),
              const SizedBox(height: 10),
              Text(
                label,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// 管理员入口卡片
class _AdminCard extends StatelessWidget {
  final VoidCallback onTap;

  const _AdminCard({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.admin_panel_settings,
            color: Color(AppColors.primaryBlue)),
        title: const Text(
          '用户管理',
          style: TextStyle(fontWeight: FontWeight.w500),
        ),
        subtitle: const Text(
          '管理平台用户与权限',
          style: TextStyle(fontSize: 12),
        ),
        trailing:
            const Icon(Icons.chevron_right, color: Color(AppColors.textHint)),
        onTap: onTap,
      ),
    );
  }
}

/// 我的会议列表
class _MeetingList extends ConsumerStatefulWidget {
  @override
  ConsumerState<_MeetingList> createState() => _MeetingListState();
}

class _MeetingListState extends ConsumerState<_MeetingList> {
  List<Meeting> _meetings = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadMeetings();
  }

  Future<void> _loadMeetings() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final repo = MeetingRepository();
      final result = await repo.getMyMeetings(limit: 50);
      if (mounted) {
        setState(() {
          _meetings = result['list'] as List<Meeting>;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceFirst('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          children: [
            Text(_error!,
                style: const TextStyle(color: Color(AppColors.textSecondary))),
            const SizedBox(height: 8),
            TextButton(onPressed: _loadMeetings, child: const Text('重试')),
          ],
        ),
      );
    }

    if (_meetings.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Text(
            '暂无会议记录',
            style: TextStyle(color: Color(AppColors.textHint)),
          ),
        ),
      );
    }

    return Column(
      children: _meetings.map((meeting) {
        return _MeetingCard(
          meeting: meeting,
          onTap: () {
            if (meeting.isActive) {
              context.push('/pre-join/${meeting.meetingId}');
            }
          },
        );
      }).toList(),
    );
  }
}

/// 会议卡片
class _MeetingCard extends StatelessWidget {
  final Meeting meeting;
  final VoidCallback onTap;

  const _MeetingCard({required this.meeting, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isActive = meeting.isActive;
    final dateStr = meeting.startedAt ?? meeting.createdAt ?? '';

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // 状态指示器
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isActive
                      ? const Color(AppColors.success)
                      : const Color(AppColors.textHint),
                ),
              ),
              const SizedBox(width: 12),
              // 会议信息
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      meeting.title ?? '会议 ${meeting.meetingId}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '会议号: ${meeting.meetingId}',
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(AppColors.textSecondary),
                      ),
                    ),
                    if (dateStr.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        dateStr,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(AppColors.textHint),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              // 状态标签
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isActive
                      ? const Color(AppColors.success).withOpacity(0.1)
                      : const Color(AppColors.textHint).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  isActive ? '进行中' : '已结束',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: isActive
                        ? const Color(AppColors.success)
                        : const Color(AppColors.textHint),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
