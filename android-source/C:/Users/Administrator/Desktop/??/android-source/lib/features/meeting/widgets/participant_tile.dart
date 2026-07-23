import 'package:flutter/material.dart';
import 'package:livekit_client/livekit_client.dart' as lk;
import '../../../core/constants.dart';
import '../providers/meeting_provider.dart';

class ParticipantTile extends StatefulWidget {
  final Participant participant;
  final bool isLocal;
  final lk.Participant? livekitParticipant;
  final bool isScreenShareMode;
  final VoidCallback? onTap;

  const ParticipantTile({
    super.key,
    required this.participant,
    this.isLocal = false,
    this.livekitParticipant,
    this.isScreenShareMode = false,
    this.onTap,
  });

  @override
  State<ParticipantTile> createState() => _ParticipantTileState();
}

class _ParticipantTileState extends State<ParticipantTile> {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      child: Container(
        margin: const EdgeInsets.all(2),
        decoration: BoxDecoration(
          color: const Color(0xFF2A2A40),
          borderRadius: BorderRadius.circular(widget.isScreenShareMode ? 8 : 12),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(widget.isScreenShareMode ? 8 : 12),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // 视频画面或占位
              _buildVideoView(),

              // 底部信息覆盖层
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 5),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [
                        Colors.black.withOpacity(0.7),
                        Colors.transparent,
                      ],
                    ),
                  ),
                  child: Row(
                    children: [
                      // 麦克风状态
                      Icon(
                        widget.participant.isMicOn
                            ? Icons.mic
                            : Icons.mic_off,
                        size: 14,
                        color: widget.participant.isMicOn
                            ? Colors.white70
                            : Colors.redAccent,
                      ),
                      const SizedBox(width: 4),
                      // 昵称
                      Expanded(
                        child: Text(
                          widget.participant.name +
                              (widget.isLocal ? ' (我)' : ''),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      // 主持人徽章
                      if (widget.participant.isHost)
                        Container(
                          margin: const EdgeInsets.only(left: 4),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 5, vertical: 1),
                          decoration: BoxDecoration(
                            color: const Color(AppColors.warning),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            '主持人',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),

              // 屏幕共享角标
              if (widget.participant.isScreenSharing)
                Positioned(
                  top: 6,
                  left: 6,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(AppColors.success),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.screen_share,
                            size: 12, color: Colors.white),
                        SizedBox(width: 2),
                        Text(
                          '共享中',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildVideoView() {
    final p = widget.livekitParticipant;

    // 有可用的视频轨道
    if (p != null && p.isCameraEnabled) {
      // 查找非屏幕共享的视频轨道
      final videoTracks = p.videoTrackPublications
          .where((pub) => !pub.isScreenShare && pub.track != null)
          .toList();

      if (videoTracks.isNotEmpty) {
        return lk.VideoTrackRenderer(
          videoTracks.first.track!,
          fit: RenderingFit.cover,
        );
      }
    }

    // 摄像头关闭时的占位
    return Container(
      color: const Color(0xFF3A3A55),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: widget.isScreenShareMode ? 18 : 28,
              backgroundColor: const Color(AppColors.primaryBlue)
                  .withOpacity(0.3),
              child: Icon(
                widget.participant.isCameraOn
                    ? Icons.person
                    : Icons.videocam_off,
                size: widget.isScreenShareMode ? 16 : 24,
                color: Colors.white54,
              ),
            ),
            if (!widget.isScreenShareMode) ...[
              const SizedBox(height: 8),
              Text(
                widget.participant.name,
                style: const TextStyle(
                  color: Colors.white38,
                  fontSize: 13,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
