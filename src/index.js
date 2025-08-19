require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { handleMessage, handleReaction } = require('./handlers');
const logger = require('./logger');

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
    logs: await discord.channels.fetch(config.channelIds.logs),
    prompt: await discord.channels.fetch(config.channelIds.prompt)
  };

  const emojis = {
    ban: config.emojis.ban,
    redo: config.emojis.redo
  };

  const roleIds = {
    api3BotImmune: config.roleIds['api3-bot-immune']
  };

  // Control messages on creation
  discord.on('messageCreate', async (message) => {
    try {
      await handleMessage(message, channels, roleIds);
    } catch (error) {
      logger.error(`Failed to handle message creation.\n${error}`);
    }
  });

  // Control messages on edit
  discord.on('messageUpdate', async (_oldMessage, newMessage) => {
    try {
      await handleMessage(newMessage, channels, roleIds);
    } catch (error) {
      logger.error(`Failed to handle message editing.\n${error}`);
    }
  });

  // Do stuff based on the emojis in logs channel
  discord.on('messageReactionAdd', async (reaction) => {
    try {
      await handleReaction(reaction, channels, emojis, discord);
    } catch (error) {
      logger.error(`Failed to handle message reaction adding.\n${error}`);
    }
  });
}

main();
