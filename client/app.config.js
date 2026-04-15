import 'dotenv/config';

export default {
  expo: {
    name: 'SWAPPA',
    slug: 'swappa',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/swappa-icon.png',
    userInterfaceStyle: 'automatic',

    ios: {
      supportsTablet: true,
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },

    android: {
      package: 'com.miya.swappa',
      adaptiveIcon: {
        backgroundColor: '#f1f5f9',
        foregroundImage: './assets/swappa-foreground.png',
        monochromeImage: './assets/swappa-monochrome.png',
      },
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },

    web: {
      bundler: 'metro',
      favicon: './assets/favicon.ico',
    },

    plugins: [
      'expo-font',
      'expo-secure-store',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#f1f5f9',
          image: './assets/swappa-foreground.png',
          dark: {
            backgroundColor: '#0f172a',
            image: './assets/swappa-foreground.png',
          },
        },
      ],
    ],
  },
};
