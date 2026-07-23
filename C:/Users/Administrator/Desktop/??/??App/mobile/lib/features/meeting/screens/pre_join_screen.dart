import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants.dart';
import '../providers/meeting_provider.dart';

class PreJoinScreen extends ConsumerStatefulWidget {
  final String meetingId;
  final bool isGuest;
  final String guestNickname;

  const PreJoinScreen({
    super.key,
    required this.meetingId,
    this.isGuest = false,
    this.guestNickname = '',
  });

  @override
  ConsumerState<PreJoinScreen> createState() => _PreJoinScreenState();
}

class _PreJoinScreenState extends ConsumerState<PreJoinScreen> {
  bool _cameraEnabled = true;
  bool _micEnabled = true;

  void _enterMeeting() {
    final meetingNotifier = ref.read(meetingProvider.notifier);
    meetingNotifier.toggleCamera();
    meetingNotifier.toggleMic();

    // 设置初始媒体状态
    if (!_cameraEnabled) meetingNotifier.toggleCamera();
    if (!_micEnabled) meetingNotifier.toggleMic();

    final queryParams = <String, String>{
      if (widget.isGuest) 'guest': 'true',
      if (widget.guestNickname.isNotEmpty)
        'nickname': widget.guestNickname,
    };

    final queryString = queryParams.entries
        .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
        .join('&');
    final path = '/meeting/${widget.meetingId}${queryString.isNotEmpty ? '?$queryString' : ''}';

    context.push(path);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('加入会议'),
      ),
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 16),

            // 摄像头预览区域
            Expanded(
              flex: 3,
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 24),
                child: _cameraEnabled
                    ? Container(
                        decoration: BoxDecoration(
                          color: Colors.black,
                          borderRadius:
                              BorderRadius.circular(16),
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.videocam,
                            size: 64,
                            color: Colors.white54,
                          ),
                        ),
                      )
                    : Container(
                        decoration: BoxDecoration(
                          color: const Color(AppColors.background),
                          borderRadius:
                              BorderRadius.circular(16),
                          border: Border.all(
                            color:
                                const Color(AppColors.border),
                          ),
                        ),
                        child: Center(
                          child: Column(
                            mainAxisAlignment:
                                MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.videocam_off,
                                size: 64,
                                color: const Color(
                                        AppColors.textHint)
                                    .withOpacity(0.5),
                              ),
                              const SizedBox(height: 12),
                              const Text(
                                '摄像头已关闭',
                                style: TextStyle(
                                  color: Color(
                                      AppColors.textHint),
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
              ),
            ),

            const SizedBox(height: 24),

            // 媒体控制
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                children: [
                  // 摄像头开关
                  _MediaToggle(
                    icon: _cameraEnabled
                        ? Icons.videocam
                        : Icons.videocam_off,
                    label: '摄像头',
                    value: _cameraEnabled,
                    onChanged: (val) {
                      setState(() => _cameraEnabled = val);
                    },
                  ),
                  const Divider(height: 1),
                  // 麦克风开关
                  _MediaToggle(
                    icon: _micEnabled
                        ? Icons.mic
                        : Icons.mic_off,
                    label: '麦克风',
                    value: _micEnabled,
                    onChanged: (val) {
                      setState(() => _micEnabled = val);
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // 会议信息
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 24),
              padding: const EdgeInsets.symmetric(
                  horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(AppColors.primaryBlue)
                    .withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.confirmation_number_outlined,
                      size: 18,
                      color: Color(AppColors.primaryBlue)),
                  const SizedBox(width: 8),
                  Text(
                    '会议号: ${widget.meetingId}',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: Color(AppColors.primaryBlue),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // 进入会议按钮
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 24),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _enterMeeting,
                  style: ElevatedButton.styleFrom(
                    textStyle: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  child: const Text('进入会议'),
                ),
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

/// 媒体开关组件
class _MediaToggle extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _MediaToggle({
    required this.icon,
    required this.label,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(
            icon,
            size: 24,
            color: value
                ? const Color(AppColors.primaryBlue)
                : const Color(AppColors.textHint),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: const Color(AppColors.primaryBlue),
          ),
        ],
      ),
    );
  }
}
