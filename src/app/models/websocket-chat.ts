export class WebsocketChat {
  userId: number;
  chatId: number;
  username: string;
  message: string;
  familyId: number; // Új mező

  constructor(userId: number, chatId: number, username: string, message: string, familyId: number) {
    this.userId = userId;
    this.chatId = chatId;
    this.username = username;
    this.message = message;
    this.familyId = familyId; // Új mező
  }
}
