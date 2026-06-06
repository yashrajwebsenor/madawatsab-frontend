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
    apiKey: "AIzaSyBol2t4I_34qxeF2XlCxVmL-9n1-KumsqM",
    authDomain: "madawatsab-1a60f.firebaseapp.com",
    projectId: "madawatsab-1a60f",
    storageBucket: "madawatsab-1a60f.firebasestorage.app",
    messagingSenderId: "829547727743",
    appId: "1:829547727743:web:c55fceae2b87a2d9c3a84a",
    vapidKey:
      "BL23ouHMOtrk9xAont6ktYLH5ZbLJBUKqkd7EcKaj11S8hV3M0X7OhMNyeLCqWQZVWnOo_bZ45gzCZrbZyWx9JA",
  },
};

export default APP_CONFIG;
