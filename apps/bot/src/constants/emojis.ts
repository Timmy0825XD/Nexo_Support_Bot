/** Custom animated emojis — keep in sync with docs/EMOJIS.md */
export const CUSTOM_EMOJIS = {
  done: '<a:done:1514103465851359243>',
  error: '<:error:1514105588949454949>',
  latency: '<:latency:1514106143448891535>',
  webSocket: '<:web_socket:1514106335493619742>',
  botPing: '<a:bot_ping:1513762217147895919>',
  database: '<:database:1514106679753707672>',
  servers: '<:servers:1514107674554531850>',
} as const;

export type CustomEmojiKey = keyof typeof CUSTOM_EMOJIS;

export const EMBED_COLORS = {
  success: 0x00FF14,
  error: 0xFF0000,
  warning: 0xFF8C00,
  info: 0xF200FF,
} as const;
