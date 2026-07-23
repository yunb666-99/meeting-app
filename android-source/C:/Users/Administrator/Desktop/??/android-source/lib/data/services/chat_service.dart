import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;

class ChatService {
  io.Socket? _socket;

  // 流控制器
  final StreamController<Map<String, dynamic>> _messageController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _participantJoinedController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _participantLeftController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _meetingEndedController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _kickedController =
      StreamController<Map<String, dynamic>>.broadcast();

  /// 收到聊天消息
  Stream<Map<String, dynamic>> get onMessage => _messageController.stream;

  /// 参与者加入
  Stream<Map<String, dynamic>> get onParticipantJoined =>
      _participantJoinedController.stream;

  /// 参与者离开
  Stream<Map<String, dynamic>> get onParticipantLeft =>
      _participantLeftController.stream;

  /// 会议被结束
  Stream<Map<String, dynamic>> get onMeetingEnded =>
      _meetingEndedController.stream;

  /// 被踢出
  Stream<Map<String, dynamic>> get onKicked => _kickedController.stream;

  bool get isConnected => _socket?.connected ?? false;

  /// 连接 WebSocket 并加入会议房间
  void connect(String url, String token, String meetingId) {
    disconnect();

    _socket = io.io(
      url,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .enableAutoConnect()
          .setAuth({'token': token})
          .setTimeout(10000)
          .build(),
    );

    _socket!.onConnect((_) {
      _socket!.emit('meeting:join', {
        'meetingId': meetingId,
        'token': token,
      });
    });

    _socket!.on('chat:message', (data) {
      if (data is Map<String, dynamic>) {
        _messageController.add(data);
      }
    });

    _socket!.on('participant:joined', (data) {
      if (data is Map<String, dynamic>) {
        _participantJoinedController.add(data);
      }
    });

    _socket!.on('participant:left', (data) {
      if (data is Map<String, dynamic>) {
        _participantLeftController.add(data);
      }
    });

    _socket!.on('meeting:ended', (data) {
      if (data is Map<String, dynamic>) {
        _meetingEndedController.add(data);
      } else {
        _meetingEndedController.add({});
      }
    });

    _socket!.on('participant:kicked', (data) {
      if (data is Map<String, dynamic>) {
        _kickedController.add(data);
      }
    });

    _socket!.onConnectError((err) {
      // 连接错误静默重试
    });

    _socket!.connect();
  }

  /// 发送聊天消息
  void sendMessage(String meetingId, String content) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('chat:send', {
        'meetingId': meetingId,
        'content': content,
      });
    }
  }

  /// 断开连接
  void disconnect() {
    if (_socket != null) {
      _socket!.emit('meeting:leave');
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
    }
  }

  /// 释放所有资源
  void dispose() {
    disconnect();
    _messageController.close();
    _participantJoinedController.close();
    _participantLeftController.close();
    _meetingEndedController.close();
    _kickedController.close();
  }
}
