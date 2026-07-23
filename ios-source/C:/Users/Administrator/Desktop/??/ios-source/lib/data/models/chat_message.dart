class ChatMessage {
  final String id;
  final String meetingId;
  final String senderName;
  final String senderRole;
  final String content;
  final String messageType; // 'TEXT' | 'SYSTEM'
  final String? createdAt;

  const ChatMessage({
    required this.id,
    required this.meetingId,
    required this.senderName,
    required this.senderRole,
    required this.content,
    required this.messageType,
    this.createdAt,
  });

  bool get isSystem => messageType == 'SYSTEM';
  bool get isText => messageType == 'TEXT';

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id']?.toString() ?? '',
      meetingId: json['meetingId']?.toString() ?? '',
      senderName: json['senderName'] ?? '',
      senderRole: json['senderRole'] ?? 'USER',
      content: json['content'] ?? '',
      messageType: json['messageType'] ?? 'TEXT',
      createdAt: json['createdAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'meetingId': meetingId,
      'senderName': senderName,
      'senderRole': senderRole,
      'content': content,
      'messageType': messageType,
      'createdAt': createdAt,
    };
  }
}
