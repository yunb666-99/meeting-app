import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/providers/auth_provider.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/home/screens/home_screen.dart';
import '../features/join/screens/join_screen.dart';
import '../features/meeting/screens/pre_join_screen.dart';
import '../features/meeting/screens/meeting_screen.dart';
import '../features/admin/screens/user_management_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final isLoggedIn = authState.isLoggedIn;
      final isLoginPage = state.matchedLocation == '/login';
      final isJoinPage = state.matchedLocation == '/join';

      // 登录页和加入页无需认证
      if (isLoginPage || isJoinPage) return null;

      // 其他页面需要登录
      if (!isLoggedIn) return '/login';

      return null;
    },
    routes: [
      // 登录页
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),

      // 快速加入（无需登录）
      GoRoute(
        path: '/join',
        name: 'join',
        builder: (context, state) => const JoinScreen(),
      ),

      // 首页
      GoRoute(
        path: '/home',
        name: 'home',
        builder: (context, state) => const HomeScreen(),
      ),

      // 会前预览
      GoRoute(
        path: '/pre-join/:meetingId',
        name: 'preJoin',
        builder: (context, state) {
          final meetingId = state.pathParameters['meetingId']!;
          final isGuest = state.uri.queryParameters['guest'] == 'true';
          final nickname = state.uri.queryParameters['nickname'] ?? '';
          return PreJoinScreen(
            meetingId: meetingId,
            isGuest: isGuest,
            guestNickname: nickname,
          );
        },
      ),

      // 会议界面
      GoRoute(
        path: '/meeting/:meetingId',
        name: 'meeting',
        builder: (context, state) {
          final meetingId = state.pathParameters['meetingId']!;
          final isGuest = state.uri.queryParameters['guest'] == 'true';
          final nickname = state.uri.queryParameters['nickname'] ?? '';
          return MeetingScreen(
            meetingId: meetingId,
            isGuest: isGuest,
            guestNickname: nickname,
          );
        },
      ),

      // 管理员 - 用户管理
      GoRoute(
        path: '/admin/users',
        name: 'adminUsers',
        builder: (context, state) => const UserManagementScreen(),
      ),
    ],
  );
});
