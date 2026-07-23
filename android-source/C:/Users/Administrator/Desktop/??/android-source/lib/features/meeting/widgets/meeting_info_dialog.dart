import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/constants.dart';

class MeetingInfoDialog extends StatelessWidget {
  final String meetingId;
  final String? password;

  const MeetingInfoDialog({
    super.key,
    required this.meetingId,
    this.password,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: const Row(
        children: [
          Icon(Icons.info_outline,
              color: Color(AppColors.primaryBlue), size: 22),
          SizedBox(width: 8),
          Text(
            '会议信息',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '会议号',
            style: TextStyle(
              color: Color(AppColors.textSecondary),
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 4),
          // 大号会议号，可复制
          GestureDetector(
            onTap: () {
              Clipboard.setData(ClipboardData(text: meetingId));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('会议号已复制'),
                  behavior: SnackBarBehavior.floating,
                  duration: Duration(seconds: 1),
                ),
              );
            },
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              decoration: BoxDecoration(
                color: const Color(AppColors.background),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(AppColors.border)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    meetingId,
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Color(AppColors.primaryBlue),
                      letterSpacing: 3,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(
                    Icons.copy,
                    size: 18,
                    color: Color(AppColors.textHint),
                  ),
                ],
              ),
            ),
          ),

          if (password != null && password!.isNotEmpty) ...[
            const SizedBox(height: 20),
            const Text(
              '会议密码',
              style: TextStyle(
                color: Color(AppColors.textSecondary),
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 4),
            GestureDetector(
              onTap: () {
                Clipboard.setData(ClipboardData(text: password!));
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('密码已复制'),
                    behavior: SnackBarBehavior.floating,
                    duration: Duration(seconds: 1),
                  ),
                );
              },
              child: Container(
                width: double.infinity,
                padding:
                    const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
                decoration: BoxDecoration(
                  color: const Color(AppColors.background),
                  borderRadius: BorderRadius.circular(12),
                  border:
                      Border.all(color: const Color(AppColors.border)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      password!,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w600,
                        color: Color(AppColors.textPrimary),
                        letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(
                      Icons.copy,
                      size: 16,
                      color: Color(AppColors.textHint),
                    ),
                  ],
                ),
              ),
            ),
          ],

          const SizedBox(height: 16),
          const Text(
            '点击信息即可复制',
            style: TextStyle(
              color: Color(AppColors.textHint),
              fontSize: 12,
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('关闭'),
        ),
      ],
    );
  }
}
