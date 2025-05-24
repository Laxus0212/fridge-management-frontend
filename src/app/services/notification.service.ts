import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { CacheService } from './cache.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private cacheService: CacheService) {}

  async initializeNotifications(onlyIfNewItems: boolean, notificationTime: string) {
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display !== 'granted') return;

    await this.cancelScheduledNotification();
    await this.scheduleDailyNotification(onlyIfNewItems, notificationTime);
  }

  async cancelScheduledNotification() {
    await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });
  }

  private async scheduleDailyNotification(onlyIfNewItems: boolean, notificationTime: string) {
    const [hours, minutes] = notificationTime.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    if (now > scheduledTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const allProducts = await firstValueFrom(this.cacheService.getAllFridgeProducts());
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const inFiveDays = new Date();
    inFiveDays.setDate(today.getDate() + 5);

    const newlyExpiring = allProducts?.filter(p => {
      const exp = new Date(p.expirationDate);
      return exp >= today && exp <= inFiveDays;
    });

    const newlyExpired = allProducts?.filter(p => {
      const expStr = new Date(p.expirationDate).toISOString().split('T')[0];
      return expStr === todayStr;
    });

    if (onlyIfNewItems && newlyExpiring?.length === 0 && newlyExpired?.length === 0) {
      return;
    }

    const body = `📦 ${newlyExpiring?.length} új közeli lejáratú, ❌ ${newlyExpired?.length} lejárt termék ma`;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1001,
          title: 'Fridge Alert',
          body,
          schedule: { at: scheduledTime },
          sound: undefined,
          attachments: undefined,
          actionTypeId: '',
          extra: null,
        },
      ],
    });
  }
}
