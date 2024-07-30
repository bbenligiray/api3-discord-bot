require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { chatWithLlm } = require('./chat');

async function main() {
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

  const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

  // fetch required channels
  const banAnnouncementsChannel = await discord.channels.fetch(config.banAnnouncementsChannelId);
  const rulesChannel = await discord.channels.fetch(config.rulesChannelId);
  const logsChannel = await discord.channels.fetch(config.logChannelId);

  // Control messages
  discord.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Don't check messages from people with a certain "trusted" role
    const member = await message.guild.members.fetch(message.author.id);
    const memberRoles = member.roles.cache.map((role) => role.name);
    if (memberRoles.includes(config.trustedRoleName)) return;

    // Fetch server rules from the given "rules channel"
    const rules = (await rulesChannel.messages.fetch({ limit: 1 })).first().content;
    console.log(rules);

    const chatHistory = [
      {
        role: 'user',
        content: `
          You are a content moderator for a Discord server. The server rules are: 
          ${rules}

          Return a string in the below format
        
          <result>|<reason>

          Where
          * result: Will be "YES" if the message violates the server rules, otherwise "NO"
          * reason: Will explain how message violates the server rules
        `
      },
      {
        role: 'user',
        content: message.content
      }
    ];

    const response = await chatWithLlm(chatHistory, process.env.ANTHROPIC_API_KEY);
    const [result, reason] = response.split('|');

    const isBannable = result === 'YES';
    if (isBannable) {
      const log = {
        user: `${message.author}`,
        channel: `<#${message.channel.id}>`,
        message: message.content,
        reason: reason
      };
      await logsChannel.send(JSON.stringify(log));
      await message.delete();
    }
  });

  // Do stuff based on the emojis in log channel
  discord.on('messageReactionAdd', async (reaction) => {
    // Reacted message must be in log channel
    if (reaction.message.channelId !== config.logChannelId) {
      return;
    }

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error('Something went wrong when fetching the reaction: ', error);
        return;
      }
    }

    switch (reaction.emoji.identifier) {
      // ban user
      case config.emojis.banEmoji.identifier: {
        const message = reaction.message;
        const log = JSON.parse(message.content);
        const originalUserId = log.user.match(/<@(\d+)>/)[1];
        const originalChannelId = log.channel.match(/<#(\d+)>/)[1];
        const originalMessage = log.message;

        const messageOwner = reaction.message.guild.members.cache.get(originalUserId);
        await messageOwner.ban();
        const banLog = {
          user: `${log.user}`,
          message: originalMessage,
          channel: `<#${originalChannelId}>`
        };
        await banAnnouncementsChannel.send(JSON.stringify(banLog));
        break;
      }
      // repost accidentally deleted message
      case config.emojis.redoDeletionEmoji.identifier: {
        const message = reaction.message;

        const log = JSON.parse(message.content);
        const originalUser = log.user;
        const originalChannelId = log.channel.match(/<#(\d+)>/)[1];
        const originalMessage = log.message;

        const targetChannel = await discord.channels.fetch(originalChannelId);
        targetChannel.send(
          `[REPOST] - This message from ${originalUser} was deleted accidentally:\n${originalMessage}`
        );
        break;
      }
    }
  });
}

main();
