// Google AdMob Configuration
// Banner: ca-app-pub-6423718618240244/6735134164
// Interstitial: ca-app-pub-6423718618240244/6735134164

export interface AdMobConfig {
  publisherId: string;
  bannerAdUnitId: string;
  bannerSlotId: string;
  interstitialAdUnitId: string;
  interstitialSlotId: string;
}

export const ADS_CONFIG: AdMobConfig = {
  publisherId: 'ca-app-pub-6423718618240244',
  bannerAdUnitId: 'ca-app-pub-6423718618240244/6735134164',
  bannerSlotId: '6735134164',
  interstitialAdUnitId: 'ca-app-pub-6423718618240244/6735134164',
  interstitialSlotId: '6735134164',
};

// Key to control banner ad visibility in local preferences if user toggles it
export const AD_BANNER_STORAGE_KEY = 'flat_bill_show_banner_ad';

export function isBannerAdEnabled(): boolean {
  const stored = localStorage.getItem(AD_BANNER_STORAGE_KEY);
  return stored !== 'false';
}

export function setBannerAdEnabled(enabled: boolean): void {
  localStorage.setItem(AD_BANNER_STORAGE_KEY, enabled ? 'true' : 'false');
}

// Native bridge helper: sends messages to WebView if hosted inside Android/Cordova/Capacitor
export function notifyNativeAdMob(eventType: 'SHOW_BANNER' | 'HIDE_BANNER' | 'SHOW_INTERSTITIAL'): void {
  try {
    const win = window as any;
    if (win.admob) {
      if (eventType === 'SHOW_BANNER') {
        win.admob.banner?.show?.({ id: ADS_CONFIG.bannerAdUnitId });
      } else if (eventType === 'HIDE_BANNER') {
        win.admob.banner?.hide?.();
      } else if (eventType === 'SHOW_INTERSTITIAL') {
        win.admob.interstitial?.show?.({ id: ADS_CONFIG.interstitialAdUnitId });
      }
    } else if (win.AndroidBridge) {
      if (eventType === 'SHOW_BANNER' && win.AndroidBridge.showBanner) {
        win.AndroidBridge.showBanner(ADS_CONFIG.bannerAdUnitId);
      } else if (eventType === 'SHOW_INTERSTITIAL' && win.AndroidBridge.showInterstitial) {
        win.AndroidBridge.showInterstitial(ADS_CONFIG.interstitialAdUnitId);
      }
    }
  } catch (err) {
    console.debug('Native AdMob bridge not available or failed:', err);
  }
}
