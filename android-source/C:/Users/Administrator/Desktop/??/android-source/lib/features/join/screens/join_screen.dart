import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants.dart';
import '../../../data/repositories/meeting_repository.dart';

class JoinScreen extends ConsumerStatefulWidget {
  const JoinScreen({super.key});

  @override
  ConsumerState<JoinScreen> createState() => _JoinScreenState();
}

class _JoinScreenState extends ConsumerState<JoinScreen> {
  final _formKey = GlobalKey<FormState>();
  final _meetingIdController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nicknameController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _meetingIdController.dispose();
    _passwordController.dispose();
    _nicknameController.dispose();
    super.dispose();
  }

  Future<void> _handleJoin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final meetingId = _meetingIdController.text.trim();
      final password = _passwordController.text.trim();
      final nickname = _nicknameController.text.trim();

      // 尝试以访客身份加入
      final meetingRepo = MeetingRepository();
      await meetingRepo.joinAsGuest(meetingId, password, nickname);

      if (!mounted) return;

      context.push(
        '/pre-join/$meetingId?guest=true&nickname=$nickname',
      );
    } catch (e) {
      if (!mounted) return;
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
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('加入会议'),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // 图标
                Icon(
                  Icons.meeting_room_outlined,
                  size: 64,
                  color: const Color(AppColors.primaryBlue)
                      .withOpacity(0.6),
                ),
                const SizedBox(height: 32),

                // 会议号
                TextFormField(
                  controller: _meetingIdController,
                  keyboardType: TextInputType.number,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: '数字会议号',
                    hintText: '请输入会议号',
                    prefixIcon:
                        Icon(Icons.confirmation_number_outlined),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return '请输入会议号';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // 会议密码
                TextFormField(
                  controller: _passwordController,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: '会议密码',
                    hintText: '请输入会议密码',
                    prefixIcon: Icon(Icons.lock_outline),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return '请输入会议密码';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // 昵称
                TextFormField(
                  controller: _nicknameController,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _handleJoin(),
                  decoration: const InputDecoration(
                    labelText: '您的昵称',
                    hintText: '请输入您的昵称',
                    prefixIcon:
                        Icon(Icons.badge_outlined),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return '请输入昵称';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 32),

                // 加入按钮
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleJoin,
                    child: _isLoading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Colors.white,
                            ),
                          )
                        : const Text('加入会议'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
