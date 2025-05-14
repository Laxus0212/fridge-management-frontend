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
    this.socket = io('https://varadinas.synology.me:3001', {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      this.socket?.emit('setFamilyId', familyId);
      this.isConnected = true;

      // Betöltés (ha kell adat betöltés külön)
      this.messageService.getMessagesForChat(familyId).subscribe({
        next: (messages) => {
          const websocketMessages = messages.map(msg => ({
            messageId: msg.messageId ?? '',
            senderId: msg.senderId!,
            chatId: msg.chatId,
            username: msg.username,
            message: msg.message,
            sentAt: msg.sentAt,
            familyId: msg.familyId,
          }));
          //add to websocketMessages with sorted by sentAt
          this.websocketMessages$.next(websocketMessages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()));
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
  }

  public closeWebsocketConnection(): void {
    this.socket?.disconnect();
  }
}
