import {Injectable} from '@angular/core';
import {WebsocketChat} from '../models/websocket-chat';
import {BehaviorSubject} from 'rxjs';
import {MessageService, UserService} from '../openapi/generated-src';
import {io, Socket} from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class MessageWebsocketService {
  websocket: WebSocket | null = null;
  websocketMessages$ = new BehaviorSubject<WebsocketChat[]>([]);
  familyId: number | null = null;
  isConnected = false; // Új változó a kapcsolat állapotának nyomon követésére
  socket: Socket | undefined;

  constructor(
    private messageService: MessageService,
    private userService: UserService
  ) {
  }

  public openWebsocketConnection(familyId: number): void {
    this.familyId = familyId;
    this.socket = io('http://localhost:3001', {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected');
      console.log(this.socket);
      this.socket?.emit('setFamilyId', familyId); // ha van ilyen event
      this.isConnected = true;

      // Betöltés (ha kell adat betöltés külön)
      this.messageService.getMessagesForChat(familyId).subscribe({
        next: (messages) => {
          const websocketMessages = messages.map(msg => ({
            messageId: msg.messageId ?? '',
            senderId: msg.senderId!,
            chatId: msg.chatId,
            username: this.extractUsername(msg.senderId!),
            message: msg.message,
            familyId: this.familyId!,
          }));

          this.websocketMessages$.next(websocketMessages);
        },
        error: (err) => console.error('Load error:', err),
      });
    });

      this.socket.on('newMessage', (data: WebsocketChat) => {
        if (data.familyId === this.familyId) {
          this.websocketMessages$.next([...this.websocketMessages$.value, data]);
        }
      });

      this.socket.on('disconnect', () => {
        console.warn('❌ Socket.IO disconnected');
      });
    }


  private extractUsername(senderId: number): string {
    // Feltételezve, hogy van egy olyan szolgáltatás, ami képes lekérni a felhasználókat
    let username = 'Unknown User';

    this.userService.getUserById(senderId).subscribe({
      next: (user) => {
        username = user.username;
      },
      error: (error) => {
        console.error('Failed to get username:', error);
      }
    });

    return username;
  }

  sendWebsocketMessage(message: WebsocketChat): void {
    if (!this.socket?.connected) {
      console.error('Socket.IO not connected, retrying...');
      setTimeout(() => this.sendWebsocketMessage(message), 1000);
      return;
    }

    message.familyId = this.familyId!;
    this.socket.emit('sendMessage', message);

    // DB mentés
    this.messageService.sendMessage({
      messageId: message.messageId,
      chatId: message.chatId,
      senderId: message.senderId,
      username: message.username,
      message: message.message,
      familyId: message.familyId,
      sentAt: new Date().toISOString(),
    }).subscribe({
      next: () => console.log('Message saved'),
      error: (err) => console.error('Save failed:', err),
    });
  }

  public closeWebsocketConnection(): void {
    this.socket?.disconnect();
  }
}
