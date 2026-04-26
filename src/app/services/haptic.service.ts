import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

@Injectable({ providedIn: 'root' })
export class HapticService {
  private readonly isNative = Capacitor.isNativePlatform();

  async lightImpact(): Promise<void> {
    if (this.isNative) await Haptics.impact({ style: ImpactStyle.Light });
  }

  async mediumImpact(): Promise<void> {
    if (this.isNative) await Haptics.impact({ style: ImpactStyle.Medium });
  }

  async heavyImpact(): Promise<void> {
    if (this.isNative) await Haptics.impact({ style: ImpactStyle.Heavy });
  }

  async vibrate(): Promise<void> {
    if (this.isNative) await Haptics.vibrate();
  }

  async success(): Promise<void> {
    if (this.isNative) await Haptics.notification({ type: NotificationType.Success });
  }

  async error(): Promise<void> {
    if (this.isNative) await Haptics.notification({ type: NotificationType.Error });
  }

  async warning(): Promise<void> {
    if (this.isNative) await Haptics.notification({ type: NotificationType.Warning });
  }
}
