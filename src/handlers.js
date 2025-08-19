const { chat } = require('./llm');
const logger = require('./logger');

const handleMessage = async (message, channels, roleIds) => {
  if (message.author.bot) return;

  let author;
  try {
    author = await message.guild.members.fetch(message.author.id);
  } catch (error) {
    if (error.code === 10007) {
      logger.warn(`Attempted to process a message from a user who is no longer in the server: ${message.author.id}`);
      return;
    }
    throw error;
  }
  const memberRoleIds = author.roles.cache.map((role) => role.id);
  if (memberRoleIds.includes(roleIds.api3BotImmune)) return;

  const prompt = (await channels.prompt.messages.fetch({ limit: 1 })).first().content;
  const messages = [
    {
      role: 'system',
      content: prompt
    },
    {
      role: 'user',
      content: message.content
    }
  ];

  const response = await chat(messages);
  const [result, reason] = response.split('|');

  if (result === 'YES') {
    await message.delete();
    const timeoutLengthInHours = 24;
    await author.timeout(timeoutLengthInHours * 60 * 60 * 1000);
    await channels.logs.send(
      JSON.stringify(
        {
          user: `${message.author}`,
          channel: `<#${message.channel.id}>`,
          message: message.content,
          reason: reason
        },
        null,
        2
      )
    );
    await channels.announcements.send(
      `${message.author}, I deleted your message at <#${message.channel.id}> and put you on timeout for ${timeoutLengthInHours} hours because \`${reason}\` Our moderators will review this.`
    );
  }
};

const handleReaction = async (reaction, channels, emojis, discord) => {
  if (reaction.message.channelId !== channels.logs.id) {
    return;
  }

  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      logger.error('Something went wrong when fetching the reaction: ', error);
      return;
    }
  }

  // Only api3-bot-maintainers have access to the logs channel
  // so we know that the user is authorized
  switch (reaction._emoji.name) {
    case emojis.ban: {
      const log = JSON.parse(reaction.message.content);
      const originalUserId = log.user.match(/<@(\d+)>/)[1];
      const originalChannelId = log.channel.match(/<#(\d+)>/)[1];
      let originalUser;
      try {
        originalUser = await reaction.message.guild.members.fetch(originalUserId);
      } catch (error) {
        if (error.code === 10007) {
          logger.warn(`Attempted to ban a user who is no longer in the server: ${originalUserId}`);
          return;
        }
        throw error;
      }
      await originalUser.ban();
      await channels.announcements.send(
        `${originalUser} is banned for their message at <#${originalChannelId}> after a moderator reviewed my report.`
      );
      break;
    }
    case emojis.redo: {
      const log = JSON.parse(reaction.message.content);
      const originalChannelId = log.channel.match(/<#(\d+)>/)[1];
      const originalMessage = log.message;
      const targetChannel = await discord.channels.fetch(originalChannelId);
      await targetChannel.send(
        `> I deleted the message below by ${log.user} for breaking server rules, but a moderator told me to repost it and take them out of timeout. Sorry!\n ${originalMessage}`
      );
      const originalUserId = log.user.match(/<@(\d+)>/)[1];
      let originalUser;
      try {
        originalUser = await reaction.message.guild.members.fetch(originalUserId);
      } catch (error) {
        if (error.code === 10007) {
          logger.warn(`Attempted to un-timeout a user who is no longer in the server: ${originalUserId}`);
          return;
        }
        throw error;
      }
      await originalUser.timeout(null);
      break;
    }
  }
};

module.exports = {
  handleMessage,
  handleReaction
};
