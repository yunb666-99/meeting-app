class User {
  final String id;
  final String account;
  final String nickname;
  final String role; // 'USER' | 'ADMIN'
  final String? avatarUrl;
  final bool isActive;
  final String? lastLoginAt;
  final String? createdAt;

  const User({
    required this.id,
    required this.account,
    required this.nickname,
    required this.role,
    this.avatarUrl,
    required this.isActive,
    this.lastLoginAt,
    this.createdAt,
  });

  bool get isAdmin => role == 'ADMIN';

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id']?.toString() ?? '',
      account: json['account'] ?? '',
      nickname: json['nickname'] ?? '',
      role: json['role'] ?? 'USER',
      avatarUrl: json['avatarUrl'],
      isActive: json['isActive'] ?? true,
      lastLoginAt: json['lastLoginAt'],
      createdAt: json['createdAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'account': account,
      'nickname': nickname,
      'role': role,
      'avatarUrl': avatarUrl,
      'isActive': isActive,
      'lastLoginAt': lastLoginAt,
      'createdAt': createdAt,
    };
  }

  User copyWith({
    String? id,
    String? account,
    String? nickname,
    String? role,
    String? avatarUrl,
    bool? isActive,
    String? lastLoginAt,
    String? createdAt,
  }) {
    return User(
      id: id ?? this.id,
      account: account ?? this.account,
      nickname: nickname ?? this.nickname,
      role: role ?? this.role,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      isActive: isActive ?? this.isActive,
      lastLoginAt: lastLoginAt ?? this.lastLoginAt,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
