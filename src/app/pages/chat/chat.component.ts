import {Component, OnDestroy, OnInit} from '@angular/core';
import {Message, MessageService, User, UserService} from '../../openapi/generated-src';
import {ActivatedRoute} from '@angular/router';
import {CommonService} from '../../services/common.service';
import {AuthService} from '../../services/auth.service';
import {ActionSheetController} from '@ionic/angular';
import {MessageWebsocketService} from '../../services/message.websocket.service';
import {WebsocketChat} from '../../models/websocket-chat';
import {v4 as uuidv4} from 'uuid';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnDestroy {
  chatId: number;
  chatTitle = 'Family Chat';
  prevWebsocketMessages: Message[] = [];
  websocketMessages: Message[] = [];
  newMessageText = '';
  isLoading = true;
  editingMessageId: string | null = null;
  messageParticipants: User[] = [];
  userId?: number;
  familyId?: number;

  constructor(
    private route: ActivatedRoute,
    private messageService: MessageService,
    private commonService: CommonService,
    private authService: AuthService,
    private actionSheetController: ActionSheetController,
    private userService: UserService,
    public websocketService: MessageWebsocketService,
  ) {
    this.chatId = parseInt(this.route.snapshot.paramMap.get('chatId') || '1', 10);
  }

  ngOnInit() {
    const uId = this.authService.getUserId();
    this.userId = uId ? uId : undefined;
    const fId = this.authService.getUserFamilyId();
    this.familyId = fId ? fId : undefined;
    if (this.userId) {
      // Websocket connection open
      this.websocketService.openWebsocketConnection(this.userId);

      this.loadMessages();

      // Websocket message subscription
      this.websocketService.websocketMessages$.subscribe((messages: WebsocketChat[]) => {
        this.websocketMessages = messages.map((msg) => this.convertWebsocketChatToMessage(msg));

        console.log('Websocket messages:', this.websocketMessages);
      });
    }
  }

  ngOnDestroy() {
    // Websocket connection close
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

    if (this.userId && this.familyId) {
      const websocketMessage: WebsocketChat = {
        userId: this.userId,
        chatId: this.chatId,
        username: this.authService.getUsername(),
        message: this.newMessageText,
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
      senderId: websocketChat.userId,
      message: websocketChat.message,
      sentAt: new Date().toISOString(), // Current time
    };
  }

  // Load all websocketMessages for the chat
  loadMessages() {
    this.isLoading = true;
    this.messageService.getMessagesForChat(this.chatId).subscribe({
      next: (messages: Message[]) => {
        this.prevWebsocketMessages = messages;
        messages.forEach(message => {
          this.getMessageSenderDetails(message);
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load messages:', error);
        void this.commonService.presentToast('Error loading messages', 'danger');
        this.isLoading = false;
      }
    });
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

  getMessageSenderName(message: Message): string {
    const user = this.messageParticipants.find(user => user.userId === message.senderId);
    return user ? user.username : 'User';
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
