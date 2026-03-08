import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId:   'com.alokmessage.app',
  appName: 'Alok Message',
  webDir:  'out',
  server: {
    androidScheme: 'https',
    // For development — remove for production
    url:           'http://localhost:3000',
    cleartext:     true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#00d4ff',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide:     true,
      backgroundColor:    '#05071a',
      androidSplashResourceName: 'splash',
      androidScaleType:   'CENTER_CROP',
      showSpinner:        false,
      splashFullScreen:   true,
      splashImmersive:    true,
    },
    StatusBar: {
      style:           'DARK',
      backgroundColor: '#05071a',
    },
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    buildOptions: {
      keystorePath:     'alok-message.keystore',
      keystoreAlias:    'alok-message-key',
    },
  },
}

export default config
