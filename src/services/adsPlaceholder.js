// Placeholder for future AdMob integration.
// The app currently ships WITHOUT ads. When ready:
//   1. npx expo install react-native-google-mobile-ads
//   2. Add plugin config in app.json with the AdMob app IDs.
//   3. Flip `adMobEnabled` in app.json extra to true.
//   4. Use loadBanner()/loadInterstitial() from this file.

import Constants from 'expo-constants';

export function adsEnabled() {
  const flag = Constants?.expoConfig?.extra?.adMobEnabled;
  return !!flag;
}

export async function loadBanner() {
  if (!adsEnabled()) return null;
  return null;
}

export async function loadInterstitial() {
  if (!adsEnabled()) return null;
  return null;
}
