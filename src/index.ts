import 'dotenv/config'
import { Client, GatewayIntentBits } from 'discord.js'

import { appConfig } from '../config'
import { onMessageCreate } from './message-create'
import { onMessageDelete } from './message-delete'
import { onMessageUpdate } from './message-update'
import { initMediaModule } from './media-module-run'

const {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_TOKEN,
} = process.env

if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_TOKEN) {
  throw new Error('Missing required environment variables, please check your .env file or refer to the README.md for instructions.')
}

const { mediaModules } = appConfig
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

client.once('ready', (c) => {
  console.log(`Logged in as ${c.user.tag}`)
  c.on('messageCreate', (message) => onMessageCreate(c, message, mediaModules))
  c.on('messageDelete', (message) => onMessageDelete(c, message, mediaModules))
  c.on('messageUpdate', (oldMessage, newMessage) => onMessageUpdate(c, oldMessage, newMessage, mediaModules))
  mediaModules.forEach((mediaModule) => initMediaModule(c, mediaModule))
})

client.login(DISCORD_CLIENT_TOKEN)