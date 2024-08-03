const fs = require('fs');
require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { handleMessage, handleReaction } = require('./handlers');

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
    announcements: await discord.channels.fetch(config.channelIds.announcements),
    log: await discord.channels.fetch(config.channelIds.log),
    prompt: await discord.channels.fetch(config.channelIds.prompt)
  };

  // Control messages on creation
  discord.on('messageCreate', async (message) => {
    handleMessage(message, config, channels.prompt, channels.log);
  });

  // Control messages on edit
  discord.on('messageUpdate', (_oldMessage, newMessage) => {
    handleMessage(newMessage, config, channels.prompt, channels.log);
  });

  // Do stuff based on the emojis in log channel
  discord.on('messageReactionAdd', async (reaction) => {
    handleReaction(reaction, config, channels.announcements, channels.log, discord);
  });
}

main();
