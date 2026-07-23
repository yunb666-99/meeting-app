class Meeting {
  final String id;
  final String meetingId;
  final String? title;
  final String hostId;
  final String? hostName;
  final String status; // 'ACTIVE' | 'ENDED'
  final String? password;
  final String? startedAt;
  final String? endedAt;
  final String? createdAt;

  const Meeting({
    required this.id,
    required this.meetingId,
    this.title,
    required this.hostId,
    this.hostName,
    required this.status,
    this.password,
    this.startedAt,
    this.endedAt,
    this.createdAt,
  });

  bool get isActive => status == 'ACTIVE';

  factory Meeting.fromJson(Map<String, dynamic> json) {
    return Meeting(
      id: json['id']?.toString() ?? '',
      meetingId: json['meetingId']?.toString() ?? '',
      title: json['title'],
      hostId: json['hostId']?.toString() ?? '',
      hostName: json['hostName'],
      status: json['status'] ?? 'ACTIVE',
      password: json['password'],
      startedAt: json['startedAt'],
      endedAt: json['endedAt'],
      createdAt: json['createdAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'meetingId': meetingId,
      'title': title,
      'hostId': hostId,
      'hostName': hostName,
      'status': status,
      'password': password,
      'startedAt': startedAt,
      'endedAt': endedAt,
      'createdAt': createdAt,
    };
  }
}
