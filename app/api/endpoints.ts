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
    COMPATIBILITY: (id: string) => `/profile/${id}/compatibility`,
    PAUSE: "/profile/pause",
    DELETE_ACCOUNT: "/profile/me",
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
    INVOICES: "/payments/invoices",
    INVOICE: (id: string) => `/payments/invoices/${id}`,
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
  ACTIVITY: {
    UNREAD_COUNTS: "activity/unread-counts",
    MARK_READ: "activity/mark-read",
    ALL: "activity/all",
  },
  GALLERY_REQUESTS: {
    SEND: "gallery-requests/send",
    RESPOND: (id: string) => `gallery-requests/${id}/respond`,
    LIST: "gallery-requests/list",
  },
  SHORTLISTS: {
    TOGGLE: "shortlists/toggle",
    LIST: "shortlists",
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
    CREATE_ROOM: "chats/rooms",
    GET_ROOMS: "chats/rooms",
    GET_ROOM_SUMMARY: (roomId: string) => `chats/rooms/${roomId}/summary`,
    GET_MESSAGES: (roomId: string) => `chats/${roomId}/messages`,
    SEARCH_MESSAGES: (roomId: string) => `chats/${roomId}/messages/search`,
    MESSAGES_AROUND: (roomId: string, messageId: string) =>
      `chats/${roomId}/messages/around/${messageId}`,
    DELETE_MESSAGE_FOR_ME: (roomId: string, messageId: string) =>
      `chats/${roomId}/messages/${messageId}/me`,
    CLEAR_CHAT: (roomId: string) => `chats/${roomId}/messages`,
  },
  NOTIFICATIONS: {
    REGISTER: "notifications/register-token",
    UNREGISTER: "notifications/unregister-token",
    LIST: "notifications",
    UNREAD_COUNTS: "notifications/unread-counts",
    MARK_READ: "notifications/mark-read",
  },
  ATTACHMENTS: {
    UPLOAD: "attachments/upload",
  },
  BLOCKS: {
    CREATE: "blocks",
    REMOVE: (userId: string) => `blocks/${userId}`,
    LIST: "blocks",
  },
  REPORTS: {
    CREATE: "reports",
  },
};

export default ENDPOINTS;
