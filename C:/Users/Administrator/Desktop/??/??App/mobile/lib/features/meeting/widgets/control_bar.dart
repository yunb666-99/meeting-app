import 'package:flutter/material.dart';
import '../../../core/constants.dart';
import '../providers/meeting_provider.dart';

class ControlBar extends StatelessWidget {
  final bool isMicOn;
  final bool isCameraOn;
  final bool isScreenSharing;
  final bool isHost;
  final VoidCallback onMicTap;
  final VoidCallback onCameraTap;
  final VoidCallback onScreenShareTap;
  final VoidCallback onChatTap;
  final VoidCallback onLeaveTap;
  final ValueChanged<String> onHostAction;
  final List<Participant> participants;
  final String currentIdentity;
  final ValueChanged<String> onKickParticipant;

  const ControlBar({
    super.key,
    required this.isMicOn,
    required this.isCameraOn,
    required this.isScreenSharing,
    required this.isHost,
    required this.onMicTap,
    required this.onCameraTap,
    required this.onScreenShareTap,
    required this.onChatTap,
    required this.onLeaveTap,
    required this.onHostAction,
    required this.participants,
    required this.currentIdentity,
    required this.onKickParticipant,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFF1A1A2E),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      child: SafeArea(
        top: false,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            // 麦克风
            _ControlButton(
              icon: isMicOn ? Icons.mic : Icons.mic_off,
              label: isMicOn ? '静音' : '取消静音',
              isActive: isMicOn,
              backgroundColor: isMicOn
                  ? const Color(0xFF3A3A55)
                  : const Color(AppColors.error).withOpacity(0.3),
              iconColor: isMicOn ? Colors.white : const Color(AppColors.error),
              onTap: onMicTap,
            ),

            // 摄像头
            _ControlButton(
              icon: isCameraOn ? Icons.videocam : Icons.videocam_off,
              label: isCameraOn ? '摄像头' : '摄像头',
              isActive: isCameraOn,
              backgroundColor: isCameraOn
                  ? const Color(0xFF3A3A55)
                  : const Color(AppColors.error).withOpacity(0.3),
              iconColor:
                  isCameraOn ? Colors.white : const Color(AppColors.error),
              onTap: onCameraTap,
            ),

            // 屏幕共享
            _ControlButton(
              icon: isScreenSharing
                  ? Icons.stop_screen_share
                  : Icons.screen_share,
              label: '共享',
              isActive: isScreenSharing,
              backgroundColor: isScreenSharing
                  ? const Color(AppColors.success).withOpacity(0.3)
                  : const Color(0xFF3A3A55),
              iconColor: isScreenSharing
                  ? const Color(AppColors.success)
                  : Colors.white,
              onTap: onScreenShareTap,
            ),

            // 聊天
            _ControlButton(
              icon: Icons.chat_bubble_outline,
              label: '聊天',
              isActive: false,
              backgroundColor: const Color(0xFF3A3A55),
              iconColor: Colors.white,
              onTap: onChatTap,
            ),

            // 主持人操作菜单
            if (isHost)
              PopupMenuButton<String>(
                offset: const Offset(0, -200),
                color: const Color(0xFF2A2A40),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                onSelected: (action) {
                  if (action == 'kick_') return;
                  if (action.startsWith('kick_')) {
                    onKickParticipant(action.replaceFirst('kick_', ''));
                  } else {
                    onHostAction(action);
                  }
                },
                itemBuilder: (ctx) {
                  final menuItems = <PopupMenuEntry<String>>[
                    const PopupMenuItem(
                      value: 'mute_all',
                      child: Row(
                        children: [
                          Icon(Icons.volume_off,
                              size: 18, color: Colors.white70),
                          SizedBox(width: 8),
                          Text('全体静音',
                              style: TextStyle(
                                  color: Colors.white, fontSize: 14)),
                        ],
                      ),
                    ),
                    const PopupMenuDivider(
                        height: 1,
                        color: Color(AppColors.divider)),
                  ];

                  // 添加踢出参与者选项
                  for (final p in participants) {
                    if (p.identity != currentIdentity && !p.isHost) {
                      menuItems.add(
                        PopupMenuItem(
                          value: 'kick_${p.identity}',
                          child: Row(
                            children: [
                              const Icon(Icons.person_remove,
                                  size: 18, color: Colors.orangeAccent),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  '踢出 ${p.name}',
                                  style: const TextStyle(
                                      color: Colors.white, fontSize: 14),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }
                  }

                  menuItems.addAll([
                    const PopupMenuDivider(
                        height: 1,
                        color: Color(AppColors.divider)),
                    const PopupMenuItem(
                      value: 'end_meeting',
                      child: Row(
                        children: [
                          Icon(Icons.stop_circle_outlined,
                              size: 18, color: Color(AppColors.error)),
                          SizedBox(width: 8),
                          Text('结束会议',
                              style: TextStyle(
                                  color: Color(AppColors.error),
                                  fontSize: 14)),
                        ],
                      ),
                    ),
                  ]);

                  return menuItems;
                },
                child: Container(
                  width: 42,
                  height: 42,
                  decoration: const BoxDecoration(
                    color: Color(0xFF3A3A55),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.more_horiz,
                    color: Colors.white,
                    size: 22,
                  ),
                ),
              ),

            // 离开按钮
            _ControlButton(
              icon: Icons.call_end,
              label: '离开',
              isActive: false,
              backgroundColor: const Color(AppColors.error),
              iconColor: Colors.white,
              onTap: onLeaveTap,
            ),
          ],
        ),
      ),
    );
  }
}

class _ControlButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final Color backgroundColor;
  final Color iconColor;
  final VoidCallback onTap;

  const _ControlButton({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.backgroundColor,
    required this.iconColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: backgroundColor,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 22),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }
}
