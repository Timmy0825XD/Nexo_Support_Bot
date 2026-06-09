/** Custom animated emojis — keep in sync with docs/EMOJIS.md */
export const CUSTOM_EMOJIS = {
  done: '<a:done:1513760252221325383>',
  error: '<a:error:1513760971066183900>',
  latency: '<a:latency:1513761208971296919>',
  webSocket: '<a:web_socket:1513761799651197018>',
  botPing: '<a:bot_ping:1513762217147895919>',
  database: '<a:database:1513762474162258000>',
  servers: '<a:servers:1513762963184422963>',
} as const;

export type CustomEmojiKey = keyof typeof CUSTOM_EMOJIS;

export const EMBED_COLORS = {
  success: 0x00FF14,
  error: 0xFF0000,
  warning: 0xFF8C00,
  info: 0xF200FF,
} as const;
