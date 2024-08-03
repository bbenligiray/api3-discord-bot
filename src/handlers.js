const { chat } = require('./openrouter');

const handleMessage = async (message, channels, roleIds) => {
  if (message.author.bot) return;

  const author = await message.guild.members.fetch(message.author.id);
  const memberRoleIds = author.roles.cache.map((role) => role.id);
  if (memberRoleIds.includes(roleIds.api3BotImmune)) return;

  // Fetch server rules from the given "rules channel"
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

  const response = await chat('anthropic/claude-3.5-sonnet', messages, process.env.OPENROUTER_API_KEY);
  const [result, reason] = response.split('|');

  if (result === 'YES') {
    await message.delete();
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
      `${message.author}, I deleted your message at <#${message.channel.id}> because \`${reason}\`. Our moderators will review this.`
    );
  }
};

const handleReaction = async (reaction, config, channels, discord) => {
  // Reacted message must be in logs channel
  if (reaction.message.channelId !== channels.logs.id) {
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
      await channels.announcements.send(JSON.stringify(banLog));
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
      targetChannel.send(`[REPOST] - This message from ${originalUser} was deleted accidentally:\n${originalMessage}`);
      break;
    }
  }
};

module.exports = {
  handleMessage,
  handleReaction
};
