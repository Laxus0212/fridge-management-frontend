import {Component, OnDestroy, OnInit} from '@angular/core';
import {Message, MessageService, User, UserService} from '../../openapi/generated-src';
import {ActivatedRoute} from '@angular/router';
import {CommonService} from '../../services/common.service';
import {AuthService} from '../../services/auth.service';
import {ActionSheetController} from '@ionic/angular';
import {MessageWebsocketService} from '../../services/message.websocket.service';
import {WebsocketChat} from '../../models/websocket-chat';
import {v4 as uuidv4} from 'uuid';
import {AbstractPage} from '../abstract-page';
import {CacheService} from '../../services/cache.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent extends AbstractPage implements OnInit, OnDestroy {
  chatId: number | null = null;
  chatTitle = 'Family Chat';
  prevWebsocketMessages: Message[] = [];
  websocketMessages: Message[] = [];
  newMessageText = '';
  isLoading = true;
  editingMessageId: string | null = null;
  messageParticipants: User[] = [];

  constructor(
    commonService: CommonService,
    authService: AuthService,
    cacheService: CacheService,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private actionSheetController: ActionSheetController,
    private userService: UserService,
    public websocketService: MessageWebsocketService,
  ) {
    super(authService, cacheService, commonService);
  }

  override async ngOnInit() {
    super.ngOnInit();
    // Subscribe to familyId changes
    this.authService.userFamilyId$.subscribe(async (familyId) => {
      if (familyId) {
        this.familyId = familyId;
        this.chatId = await this.cacheService.getChat(this.familyId).then(chat => chat?.chatId ?? null);

        if (this.chatId) {
          this.websocketService.openWebsocketConnection(this.familyId);
          this.websocketService.websocketMessages$.subscribe((messages: WebsocketChat[]) => {
            this.websocketMessages = messages.map((msg) => this.convertWebsocketChatToMessage(msg));
            this.isLoading = false;
          });
        }
      } else {
        this.clearChatData(); // Clear chat data if no family is associated
      }
    });
  }

  ngOnDestroy() {
    // Websocket connection close
    this.websocketService.closeWebsocketConnection();
  }

  clearChatData() {
    this.chatId = null;
    this.websocketMessages = [];
    this.prevWebsocketMessages = [];
    this.websocketService.closeWebsocketConnection();
  }

  sendMessage() {
    if (this.newMessageText.trim() === '') {
      return; // Don't send empty messages
    }

    if (!this.websocketService.isConnected) {
      console.error('Websocket is not connected. Please try again.');
      void this.commonService.presentToast('Websocket is not connected. Please try again.', 'danger');
      return;
    }

    if (this.userId && this.familyId && this.chatId) {
      const websocketMessage: WebsocketChat = {
        senderId: this.userId,
        chatId: this.chatId,
        username: this.authService.getUsername(),
        message: this.newMessageText,
        sentAt: new Date().toISOString(),
        familyId: this.familyId,
      };
      // Send the message through the websocket
      this.websocketService.sendWebsocketMessage(websocketMessage);

      // Delete the message from the input field
      this.newMessageText = '';
    }
  }

  // WebsocketChat object to Message object conversion
  private convertWebsocketChatToMessage(websocketChat: WebsocketChat): Message {
    return {
      messageId: uuidv4(),
      chatId: websocketChat.chatId,
      senderId: websocketChat.senderId,
      username: websocketChat.username,
      message: websocketChat.message,
      sentAt: websocketChat.sentAt,
      familyId: websocketChat.familyId
    };
  }

  deleteMessage(messageId: string) {
    this.messageService.deleteMessage(messageId).subscribe({
      next: () => {
        this.websocketMessages = this.websocketMessages.filter(msg => msg.messageId !== messageId);
        void this.commonService.presentToast('Message deleted successfully!', 'success');
      },
      error: (error) => {
        console.error('Failed to delete message:', error);
        void this.commonService.presentToast('Error deleting message', 'danger');
      }
    });
  }

  // Reset message form after sending or updating
  resetMessageForm() {
    this.newMessageText = '';
    this.editingMessageId = null;
  }

  // Check if a message is currently being edited
  isEditingMessage(message: Message): boolean {
    return this.editingMessageId === message.messageId;
  }

  // Check if the message was sent by the current user
  isUserMessage(message: Message): boolean {
    return message.senderId === this.authService.getUserId();
  }

  async presentAccountActionSheet(message: Message) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Message options',
      buttons: [
        {
          text: 'Delete message',
          role: 'destructive',
          icon: 'trash-outline',
          handler: () => {
            this.deleteMessage(message.messageId!);
            console.log('Delete message clicked');
          }
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });
    await actionSheet.present();
  }

  getMessageSenderDetails(message: Message) {
    this.userService.getUserById(message.senderId!).subscribe(
      {
        next: user => {
          this.messageParticipants.push(user)
        },
        error: error => {
          console.error('Failed to get user:', error);
          void this.commonService.presentToast('Error getting user', 'danger');
        }
      }
    );
  }
}
