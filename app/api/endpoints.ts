const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login-with-mobile",
    VERIFY_OTP: "/auth/verify-otp",
    RESEND_OTP: "/auth/resend-otp",
  },
  PROFILE: {
    GET: "/profile",
    UPDATE: "/profile",
    SPIN_WHEEL: "/profile/spin-wheel",
    SPIN_WHEEL_SKIP: "/profile/spin-wheel/skip",
    UPLOAD_PROFILE_PHOTO: "/profile/upload-profile-photo",
    UPLOAD_PHOTO: "/profile/upload-photo",
    UPLOAD_MULTIPLE_PHOTOS: "/profile/upload-multiple-photos",
    DELETE_PHOTO: (id: string) => `/profile/delete-photo/${id}`,
    DISCOVER: "/profile/discover",
    GET_BY_ID: (id: string) => `/profile/${id}`,
  },
  AGENTS: {
    REQUEST: `users/agents/request`,
    GET_BY_CITY: (cityId: number) => `users/agents/${cityId}`,
  },
  FAMILY: {
    GET: "/family",
    UPDATE: "/family",
  },
  CONFIGS: {
    GET: "/configs",
    COUNTRY: "/configs/countries",
    STATE: (countryId: number) => `/configs/states/${countryId}`,
    CITY: (countryId: number, stateId: number) =>
      `/configs/cities/${countryId}/${stateId}`,
    SEARCH_CITIES: "/configs/cities/search",
    METADATA_LIST: (type: string) => `/metadata/list/${type}`,
  },
  PAYMENTS: {
    CREATE: "/payments/create",
    VERIFY: "/payments/verify",
  },
  MATCHES: {
    GET_ALL: "/matches",
    GET_BY_ID: (id: string) => `/profile/${id}`,
  },
  PLANS: {
    GET_ALL: "/plans",
  },
  SUBSCRIPTION: {
    VIEW_CONTACT: (id: string) => `/view-contact/${id}`,
    CONTACT_STATUS: (id: string) => `/contact-status/${id}`,
    CONTACT_VIEWS: "/contact-views",
  },
  HELP_SUPPORT: {
    LIST: "/help-support",
    CREATE: "/help-support",
  },
  PROFILE_VISITS: {
    LIST: "profile-visits",
  },
  GALLERY_REQUESTS: {
    SEND: "gallery-requests/send",
    RESPOND: (id: string) => `gallery-requests/${id}/respond`,
    LIST: "gallery-requests/list",
  },
  SHORTLISTS: {
    TOGGLE: "shortlists/toggle",
    LIST: "shortlists",
    IDS: "shortlists/ids",
  },
  INTERESTS: {
    SEND: "interests/send",
    RESPOND: (id: string) => `interests/${id}/respond`,
    CANCEL: (id: string) => `interests/${id}/cancel`,
    CONNECTIONS: "interests/connections",
    LIST: "interests/list",
  },
  ADVERTISEMENTS: {
    CLICK: (id: string) => `advertisements/${id}/click`,
  },
  CHAT: {
    GET_ROOMS: "chats/rooms",
    GET_ROOM_SUMMARY: (roomId: string) => `chats/rooms/${roomId}/summary`,
    GET_MESSAGES: (roomId: string) => `chats/${roomId}/messages`,
  },
  NOTIFICATIONS: {
    SUBSCRIBE: "notifications/subscribe-to-topic",
    UNSUBSCRIBE: "notifications/unsubscribe-from-topic",
  },
  ATTACHMENTS: {
    UPLOAD: "attachments/upload",
  },
};

export default ENDPOINTS;
