import 'package:flutter/material.dart';
import 'package:livekit_client/livekit_client.dart' as lk;
import '../../../data/services/livekit_service.dart';
import '../providers/meeting_provider.dart';
import 'participant_tile.dart';

class ParticipantGrid extends StatelessWidget {
  final List<Participant> participants;
  final String localIdentity;
  final bool isScreenShareMode;
  final int? columnCount;
  final LivekitService? livekitService;

  const ParticipantGrid({
    super.key,
    required this.participants,
    required this.localIdentity,
    this.isScreenShareMode = false,
    this.columnCount,
    this.livekitService,
  });

  @override
  Widget build(BuildContext context) {
    if (participants.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.videocam_off, size: 48, color: Colors.white24),
            SizedBox(height: 12),
            Text(
              '等待参与者加入...',
              style: TextStyle(color: Colors.white38, fontSize: 14),
            ),
          ],
        ),
      );
    }

    // 计算列数
    int columns;
    if (columnCount != null) {
      columns = columnCount!;
    } else if (isScreenShareMode) {
      columns = participants.length;
    } else if (participants.length <= 2) {
      columns = 2;
    } else if (participants.length <= 4) {
      columns = 2;
    } else {
      columns = 3;
    }

    // 计算每行数量
    final rows = (participants.length / columns).ceil();

    return GridView.builder(
      padding: const EdgeInsets.all(4),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: columns,
        childAspectRatio: isScreenShareMode ? 16 / 9 : 3 / 4,
        crossAxisSpacing: 4,
        mainAxisSpacing: 4,
      ),
      itemCount: participants.length,
      itemBuilder: (context, index) {
        final participant = participants[index];
        final isLocal = participant.identity == localIdentity;

        return ParticipantTile(
          participant: participant,
          isLocal: isLocal,
          isScreenShareMode: isScreenShareMode,
          livekitParticipant: null,
          onTap: () {
            // 点击参与者可以放大画面（预留功能）
          },
        );
      },
    );
  }
}
