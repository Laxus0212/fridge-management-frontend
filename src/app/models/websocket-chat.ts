export class WebsocketChat {
  messageId: string;
  senderId: number;
  chatId: number;
  username: string;
  message: string;
  familyId: number;

  constructor(messageId: string, senderId: number, chatId: number, username: string, message: string, familyId: number) {
    this.messageId = messageId;
    this.senderId = senderId;
    this.chatId = chatId;
    this.username = username;
    this.message = message;
    this.familyId = familyId;
  }
}
