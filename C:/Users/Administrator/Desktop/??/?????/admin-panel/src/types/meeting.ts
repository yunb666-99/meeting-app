export interface Meeting {
  id: string;
  meetingNumber: string;
  title: string;
  hostId: string;
  hostName: string;
  participantCount: number;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'ongoing' | 'ended';
}

export interface MeetingParticipant {
  id: string;
  userId: string;
  nickname: string;
  joinTime: string;
  leaveTime: string;
}

export interface MeetingChatMessage {
  id: string;
  userId: string;
  nickname: string;
  content: string;
  sendTime: string;
}

export interface MeetingDetail extends Meeting {
  participants: MeetingParticipant[];
  chatMessages: MeetingChatMessage[];
}

export interface LogEntry {
  id: string;
  time: string;
  adminAccount: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: string;
  ip: string;
}
