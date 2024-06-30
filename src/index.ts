import { Client, GatewayIntentBits } from 'discord.js'

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    // [DEV] CHECK IF REQUIRED FOR ATTACHMENTS
    // GatewayIntentBits.MessageContent,
  ],
})

client.on('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`)
})

client.login