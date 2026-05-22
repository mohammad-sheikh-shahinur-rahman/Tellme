export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  createdAt: string;
}

export interface Letter {
  id: string;
  toUsername: string;
  toUserId: string;
  fromUserId?: string;
  fromUsername?: string;
  encryptedContent: string;
  templateId: string;
  fontSize: string;
  attachmentBase64?: string;
  voiceBase64?: string;
  replyEncryptedContent?: string;
  repliedAt?: any;
  createdAt: any; // Firestore Timestamp
}

export type Theme = 'light' | 'dark' | 'classic' | 'sepia';

export interface WritingTemplate {
  id: string;
  name: string;
  background: string;
  textColor: string;
  fontFamily: string;
}
