import 'package:livekit_client/livekit_client.dart';

class LivekitService {
  Room? _room;

  Room? get room => _room;

  Room? get currentRoom => _room;

  /// 连接 LiveKit 房间
  Future<Room> connect(String url, String token) async {
    // 如果已有连接，先断开
    if (_room != null) {
      await disconnect();
    }

    _room = Room();

    await _room!.connect(url, token,
        roomOptions: const RoomOptions(
          adaptiveStream: true,
          dynacast: true,
        ));

    return _room!;
  }

  /// 断开连接
  Future<void> disconnect() async {
    if (_room != null) {
      await _room!.disconnect();
      await _room!.dispose();
      _room = null;
    }
  }

  /// 切换麦克风
  Future<void> toggleMicrophone(bool enabled) async {
    try {
      await _room?.localParticipant?.setMicrophoneEnabled(enabled);
    } catch (e) {
      // 权限问题或设备不可用时静默处理
    }
  }

  /// 切换摄像头
  Future<void> toggleCamera(bool enabled) async {
    try {
      await _room?.localParticipant?.setCameraEnabled(enabled);
    } catch (e) {
      // 权限问题或设备不可用时静默处理
    }
  }

  /// 开始屏幕共享
  Future<void> startScreenShare() async {
    try {
      await _room?.localParticipant?.setScreenShareEnabled(true);
    } catch (e) {
      // 屏幕共享可能不被支持
    }
  }

  /// 停止屏幕共享
  Future<void> stopScreenShare() async {
    try {
      await _room?.localParticipant?.setScreenShareEnabled(false);
    } catch (e) {
      // 静默处理
    }
  }

  /// 获取所有参与者（包括本地）
  List<Participant> get participants {
    if (_room == null) return [];
    final all = <Participant>[];
    if (_room!.localParticipant != null) {
      all.add(_room!.localParticipant!);
    }
    all.addAll(_room!.remoteParticipants.values);
    return all;
  }

  /// 获取远程参与者
  List<RemoteParticipant> get remoteParticipants {
    return _room?.remoteParticipants.values.toList() ?? [];
  }

  /// 获取本地参与者
  LocalParticipant? get localParticipant {
    return _room?.localParticipant;
  }
}
