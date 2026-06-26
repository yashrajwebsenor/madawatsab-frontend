const APP_CONFIG = {
  APP_NAME: "Madawatsab",
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  SOCKET_BASE_URL: process.env.NEXT_PUBLIC_SOCKET_URL,

  RAZORPAY_MODE: process.env.NEXT_PUBLIC_RAZORPAY_MODE,
  RAZORPAY_KEY_ID:
    process.env.NEXT_PUBLIC_RAZORPAY_MODE === "test"
      ? process.env.NEXT_PUBLIC_RAZORPAY_TEST_KEY_ID
      : process.env.NEXT_PUBLIC_RAZORPAY_LIVE_KEY_ID,
  RAZORPAY_KEY_SECRET:
    process.env.NEXT_PUBLIC_RAZORPAY_MODE === "test"
      ? process.env.NEXT_PUBLIC_RAZORPAY_TEST_KEY_SECRET
      : process.env.NEXT_PUBLIC_RAZORPAY_LIVE_KEY_SECRET,

  FIREBASE: {
    apiKey: "AIzaSyBohDMv0Dh6ExQPSqOk3JL1FfkiyQEiBcs",
    authDomain: "madawatsab-8640d.firebaseapp.com",
    projectId: "madawatsab-8640d",
    storageBucket: "madawatsab-8640d.firebasestorage.app",
    messagingSenderId: "821286014901",
    appId: "1:821286014901:web:1445aa752e15d88b6213fc",
    measurementId: "G-30RDLCBQ2F",
    vapidKey:
      "BIUkv5jZnjx00wJdCUwzC5wF8AGP_EMwlFGmrWslYeb-g4l6vaAe7vu95lN5acBaEN3_7XZfnIx0kB887vzcWcQ",
  },
};

export default APP_CONFIG;
