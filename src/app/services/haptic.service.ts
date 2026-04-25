import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class HapticService {
  private isNative = Capacitor.isNativePlatform();

  async lightImpact() {
    if (this.isNative) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  }

  async mediumImpact() {
    if (this.isNative) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
  }

  async heavyImpact() {
    if (this.isNative) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    }
  }

  async vibrate() {
    if (this.isNative) {
      await Haptics.vibrate();
    }
  }

  async success() {
    if (this.isNative) {
      await Haptics.notification({ type: 'SUCCESS' as any });
    }
  }

  async error() {
    if (this.isNative) {
      await Haptics.notification({ type: 'ERROR' as any });
    }
  }

  async warning() {
    if (this.isNative) {
      await Haptics.notification({ type: 'WARNING' as any });
    }
  }
}
