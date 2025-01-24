import { Injectable } from '@angular/core';
import { WebsocketChat } from '../models/websocket-chat';
import { BehaviorSubject } from 'rxjs';
import {MessageService} from '../openapi/generated-src';

@Injectable({
  providedIn: 'root'
})
export class MessageWebsocketService {
  websocket: WebSocket | null = null;
  websocketMessages$ = new BehaviorSubject<WebsocketChat[]>([]);
  familyId: number | null = null;
  isConnected = false; // Új változó a kapcsolat állapotának nyomon követésére

  constructor(private messageService: MessageService) { }

  public openWebsocketConnection(familyId: number): void {
    this.familyId = familyId;
    this.websocket = new WebSocket('ws://localhost:8080');

    this.websocket.onopen = () => {
      console.log('Websocket connection opened');
      this.isConnected = true; // Kapcsolat létrejött

      // Küldjük el a familyId-t a szervernek
      if (this.websocket && this.familyId) {
        this.websocket.send(JSON.stringify({ type: 'setFamilyId', familyId: this.familyId }));
      }
    };

    this.websocket.onmessage = async (event) => {
      let messageData;
      if (event.data instanceof Blob) {
        // Ha az üzenet Blob formátumú, akkor alakítsuk stringgé
        messageData = await event.data.text();
      } else {
        // Ha az üzenet string formátumú, akkor használjuk közvetlenül
        messageData = event.data;
      }

      try {
        const message: WebsocketChat = JSON.parse(messageData);
        console.log('Received WebSocket message:', message);

        // Csak az azonos familyId-val rendelkező üzeneteket tároljuk
        if (message.familyId === this.familyId) {
          const currentMessages = this.websocketMessages$.value;
          this.websocketMessages$.next([...currentMessages, message]);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.websocket.onclose = () => {
      console.log('Websocket connection closed');
      this.isConnected = false; // Kapcsolat megszakadt
    };

    this.websocket.onerror = (error) => {
      console.error('Websocket error:', error);
    };
  }

  public sendWebsocketMessage(message: WebsocketChat): void {
    if (this.websocket && this.familyId && this.isConnected) { // Csak akkor küldjünk üzenetet, ha a kapcsolat létrejött
      message.familyId = this.familyId;
      this.websocket.send(JSON.stringify(message));
    } else {
      console.error('Websocket is not connected.');
    }
    this.messageService.sendMessage({
      chat_id: message.chatId,
      sender_id: message.userId,
      message: message.message,
      sent_at: new Date().toISOString(),
    }).subscribe({
      next: () => {
        console.log('Message saved to database');
      },
      error: (error) => {
        console.error('Failed to save message to database:', error);
      },
    });
  }

  public closeWebsocketConnection(): void {
    if (this.websocket) {
      this.websocket.close();
    }
  }
}
