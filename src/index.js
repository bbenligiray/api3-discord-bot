const fs = require('fs');
require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { handleMessages, handleReactions } = require('./handlers');

async function main() {
  const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

  const discord = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
  });
  await discord.login(process.env.DISCORD_TOKEN);

  const channels = {
    banAnnouncements: await discord.channels.fetch(config.banAnnouncementsChannelId),
    rules: await discord.channels.fetch(config.rulesChannelId),
    logs: await discord.channels.fetch(config.logChannelId)
  };

  // Control messages on creation
  discord.on('messageCreate', async (message) => {
    handleMessages(message, config, channels.logs, logsChannel);
  });

  // Control messages on edit
  discord.on('messageUpdate', (_oldMessage, newMessage) => {
    handleMessages(newMessage, config, channels.rules, channels.logs);
  });

  // Do stuff based on the emojis in log channel
  discord.on('messageReactionAdd', async (reaction) => {
    handleReactions(reaction, config, channels.banAnnouncements, discord);
  });
}

main();
