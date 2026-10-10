/// <reference types="expo/types" />

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
    EXPO_PUBLIC_ENABLE_LOCAL_PREVIEW?: string;
    EXPO_PUBLIC_DEV_AUTH_TOKEN?: string;
  }
}
