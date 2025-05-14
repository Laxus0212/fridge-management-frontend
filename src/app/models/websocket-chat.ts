export class WebsocketChat {
  messageId?: string;
  senderId: number;
  chatId: number;
  username: string;
  message: string;
  sentAt: string;
  familyId: number;

  constructor(senderId: number, chatId: number, username: string, message: string, sentAt: string, familyId: number, messageId?: string) {
    this.messageId = messageId;
    this.senderId = senderId;
    this.chatId = chatId;
    this.username = username;
    this.message = message;
    this.sentAt = sentAt;
    this.familyId = familyId;
  }
}
