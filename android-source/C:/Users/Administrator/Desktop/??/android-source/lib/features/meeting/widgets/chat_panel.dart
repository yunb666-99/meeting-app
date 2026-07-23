import 'package:flutter/material.dart';
import '../../../core/constants.dart';
import '../../../data/models/chat_message.dart';

class ChatPanel extends StatefulWidget {
  final List<ChatMessage> messages;
  final String currentIdentity;
  final ValueChanged<String> onSendMessage;
  final VoidCallback onClose;

  const ChatPanel({
    super.key,
    required this.messages,
    required this.currentIdentity,
    required this.onSendMessage,
    required this.onClose,
  });

  @override
  State<ChatPanel> createState() => _ChatPanelState();
}

class _ChatPanelState extends State<ChatPanel> {
  final _textController = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    final text = _textController.text.trim();
    if (text.isEmpty) return;

    widget.onSendMessage(text);
    _textController.clear();

    // 自动滚动到底部
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFF1E1E32),
      child: Column(
        children: [
          // 头部栏
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: const BoxDecoration(
              color: Color(0xFF252540),
              border: Border(
                bottom: BorderSide(color: Color(0xFF3A3A55), width: 0.5),
              ),
            ),
            child: Row(
              children: [
                const Text(
                  '聊天',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white70, size: 20),
                  onPressed: widget.onClose,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
          ),

          // 消息列表
          Expanded(
            child: widget.messages.isEmpty
                ? const Center(
                    child: Text(
                      '暂无消息',
                      style:
                          TextStyle(color: Colors.white38, fontSize: 14),
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 8),
                    itemCount: widget.messages.length,
                    itemBuilder: (context, index) {
                      return _MessageBubble(
                        message: widget.messages[index],
                        isOwn: widget.messages[index].senderName ==
                                widget.currentIdentity ||
                            false,
                      );
                    },
                  ),
          ),

          // 输入栏
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: const BoxDecoration(
              color: Color(0xFF252540),
              border: Border(
                top: BorderSide(color: Color(0xFF3A3A55), width: 0.5),
              ),
            ),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      decoration: InputDecoration(
                        hintText: '输入消息...',
                        hintStyle: const TextStyle(
                            color: Color(AppColors.textHint), fontSize: 13),
                        filled: true,
                        fillColor: const Color(0xFF3A3A55),
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(20),
                          borderSide: BorderSide.none,
                        ),
                        isDense: true,
                      ),
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: _sendMessage,
                    child: Container(
                      width: 38,
                      height: 38,
                      decoration: const BoxDecoration(
                        color: Color(AppColors.primaryBlue),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.send_rounded,
                        color: Colors.white,
                        size: 18,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// 聊天消息气泡
class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isOwn;

  const _MessageBubble({
    required this.message,
    required this.isOwn,
  });

  @override
  Widget build(BuildContext context) {
    // 系统消息居中显示
    if (message.isSystem) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Center(
          child: Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF3A3A55).withOpacity(0.5),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              message.content,
              style: const TextStyle(
                color: Color(AppColors.textHint),
                fontSize: 12,
              ),
            ),
          ),
        ),
      );
    }

    // 普通消息气泡
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Align(
        alignment: isOwn ? Alignment.centerRight : Alignment.centerLeft,
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.55,
          ),
          child: Column(
            crossAxisAlignment:
                isOwn ? CrossAxisAlignment.end : CrossAxisAlignment.start,
            children: [
              // 发送者名称
              Padding(
                padding: const EdgeInsets.only(bottom: 2, left: 4, right: 4),
                child: Text(
                  message.senderName,
                  style: const TextStyle(
                    color: Color(AppColors.textHint),
                    fontSize: 11,
                  ),
                ),
              ),
              // 消息气泡
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isOwn
                      ? const Color(AppColors.primaryBlue)
                      : const Color(0xFF3A3A55),
                  borderRadius: BorderRadius.only(
                    topLeft: const Radius.circular(16),
                    topRight: const Radius.circular(16),
                    bottomLeft: Radius.circular(isOwn ? 16 : 4),
                    bottomRight: Radius.circular(isOwn ? 4 : 16),
                  ),
                ),
                child: Text(
                  message.content,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
