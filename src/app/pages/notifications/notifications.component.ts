import { Component, OnInit } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit {
  notificationsEnabled = true;
  onlyIfNewItems = true;
  notificationTime = '09:00';

  constructor(private notificationService: NotificationService) {}

  async ngOnInit() {
    const result = await Preferences.get({ key: 'notificationSettings' });
    if (result.value) {
      const settings = JSON.parse(result.value);
      this.notificationsEnabled = settings.enabled ?? true;
      this.onlyIfNewItems = settings.onlyIfNewItems ?? true;
      this.notificationTime = settings.notificationTime ?? '09:00';
    }

    // Induláskor egyszer beállítjuk, ha aktív
    if (this.notificationsEnabled) {
      await this.notificationService.initializeNotifications(this.onlyIfNewItems, this.notificationTime);
    }
  }

  async saveSettings() {
    await Preferences.set({
      key: 'notificationSettings',
      value: JSON.stringify({
        enabled: this.notificationsEnabled,
        onlyIfNewItems: this.onlyIfNewItems,
        notificationTime: this.notificationTime,
      }),
    });

    if (this.notificationsEnabled) {
      await this.notificationService.initializeNotifications(this.onlyIfNewItems, this.notificationTime);
    } else {
      await this.notificationService.cancelScheduledNotification();
    }
  }
}
