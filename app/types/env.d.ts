declare namespace NodeJs {
  interface ProcessEnv {
    NEXT_PUBLIC_API_BASE_URL: string;
    NEXT_PUBLIC_SOCKET_URL: string;
    NEXT_PUBLIC_RAZORPAY_MODE: string;
    NEXT_PUBLIC_RAZORPAY_TEST_KEY_ID: string;
    NEXT_PUBLIC_RAZORPAY_TEST_KEY_SECRET: string;
    NEXT_PUBLIC_RAZORPAY_LIVE_KEY_ID: string;
    NEXT_PUBLIC_RAZORPAY_LIVE_KEY_SECRET: string;
  }
}
