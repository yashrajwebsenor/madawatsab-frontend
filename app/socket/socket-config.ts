const socketEvents = {
  EMIT: {
    READ_MESSAGES: "readMessages",
    SEND_MESSAGE: "sendMessage",
    PRESENCE_BULK: "presence:bulk",
  },
  LISTEN: {
    CONNECTED: "connect",
    DISCONNECTED: "disconnect",
    CONNECT_ERROR: "connect_error",
    NEW_MESSAGE: "newMessage",
    MESSAGE_ERROR: "messageError",
    MESSAGES_READ: "messagesRead",
    PRESENCE_BULK: "presence:bulk",
    PRESENCE_UPDATE: "presence:update",
  },
};

export default socketEvents;
