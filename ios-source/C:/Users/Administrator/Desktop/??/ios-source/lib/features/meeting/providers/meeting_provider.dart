import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/meeting.dart';
import '../../../data/repositories/meeting_repository.dart';

/// 参与者信息
class Participant {
  final String identity;
  final String name;
  final bool isCameraOn;
  final bool isMicOn;
  final bool isScreenSharing;
  final bool isHost;

  const Participant({
    required this.identity,
    required this.name,
    this.isCameraOn = true,
    this.isMicOn = true,
    this.isScreenSharing = false,
    this.isHost = false,
  });

  Participant copyWith({
    String? identity,
    String? name,
    bool? isCameraOn,
    bool? isMicOn,
    bool? isScreenSharing,
    bool? isHost,
  }) {
    return Participant(
      identity: identity ?? this.identity,
      name: name ?? this.name,
      isCameraOn: isCameraOn ?? this.isCameraOn,
      isMicOn: isMicOn ?? this.isMicOn,
      isScreenSharing: isScreenSharing ?? this.isScreenSharing,
      isHost: isHost ?? this.isHost,
    );
  }
}

/// 会议状态
class MeetingState {
  final Meeting? meeting;
  final List<Participant> participants;
  final bool isHost;
  final bool cameraEnabled;
  final bool micEnabled;
  final bool isScreenSharing;
  final bool isLoading;
  final bool isChatVisible;
  final String? error;

  const MeetingState({
    this.meeting,
    this.participants = const [],
    this.isHost = false,
    this.cameraEnabled = true,
    this.micEnabled = true,
    this.isScreenSharing = false,
    this.isLoading = false,
    this.isChatVisible = false,
    this.error,
  });

  MeetingState copyWith({
    Meeting? meeting,
    List<Participant>? participants,
    bool? isHost,
    bool? cameraEnabled,
    bool? micEnabled,
    bool? isScreenSharing,
    bool? isLoading,
    bool? isChatVisible,
    String? error,
    bool clearError = false,
  }) {
    return MeetingState(
      meeting: meeting ?? this.meeting,
      participants: participants ?? this.participants,
      isHost: isHost ?? this.isHost,
      cameraEnabled: cameraEnabled ?? this.cameraEnabled,
      micEnabled: micEnabled ?? this.micEnabled,
      isScreenSharing: isScreenSharing ?? this.isScreenSharing,
      isLoading: isLoading ?? this.isLoading,
      isChatVisible: isChatVisible ?? this.isChatVisible,
      error: clearError ? null : (error ?? this.error),
    );
  }

  bool get hasScreenShare => participants.any((p) => p.isScreenSharing);
  Participant? get screenShareParticipant {
    try {
      return participants.firstWhere((p) => p.isScreenSharing);
    } catch (_) {
      return null;
    }
  }
}

/// 会议状态管理
class MeetingNotifier extends StateNotifier<MeetingState> {
  final MeetingRepository _meetingRepository = MeetingRepository();

  MeetingNotifier() : super(const MeetingState());

  /// 设置会议信息
  void setMeeting(Meeting meeting, bool isHost) {
    state = state.copyWith(meeting: meeting, isHost: isHost);
  }

  /// 添加参与者
  void addParticipant(Participant participant) {
    final exists = state.participants
        .any((p) => p.identity == participant.identity);
    if (!exists) {
      state = state.copyWith(
        participants: [...state.participants, participant],
      );
    }
  }

  /// 移除参与者
  void removeParticipant(String identity) {
    state = state.copyWith(
      participants: state.participants
          .where((p) => p.identity != identity)
          .toList(),
    );
  }

  /// 更新参与者状态
  void updateParticipant(String identity, {
    bool? isCameraOn,
    bool? isMicOn,
    bool? isScreenSharing,
  }) {
    state = state.copyWith(
      participants: state.participants.map((p) {
        if (p.identity == identity) {
          return p.copyWith(
            isCameraOn: isCameraOn ?? p.isCameraOn,
            isMicOn: isMicOn ?? p.isMicOn,
            isScreenSharing: isScreenSharing ?? p.isScreenSharing,
          );
        }
        return p;
      }).toList(),
    );
  }

  /// 切换摄像头
  void toggleCamera() {
    state = state.copyWith(cameraEnabled: !state.cameraEnabled);
  }

  /// 切换麦克风
  void toggleMic() {
    state = state.copyWith(micEnabled: !state.micEnabled);
  }

  /// 设置屏幕共享状态
  void setScreenSharing(bool sharing) {
    state = state.copyWith(isScreenSharing: sharing);
  }

  /// 切换聊天面板
  void toggleChat() {
    state = state.copyWith(isChatVisible: !state.isChatVisible);
  }

  /// 加载状态
  void setLoading(bool loading) {
    state = state.copyWith(isLoading: loading);
  }

  /// 设置错误
  void setError(String? error) {
    state = state.copyWith(error: error);
  }

  /// 重置
  void reset() {
    state = const MeetingState();
  }
}

/// Provider：会议状态
final meetingProvider =
    StateNotifierProvider<MeetingNotifier, MeetingState>((ref) {
  return MeetingNotifier();
});
