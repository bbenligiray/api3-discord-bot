const { chat } = require('./llm');

const handleMessage = async (message, channels, roleIds) => {
  if (message.author.bot) return;

  const author = await message.guild.members.fetch(message.author.id);
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
      `${message.author}, I deleted your message at <#${message.channel.id}> because \`${reason}\` Our moderators will review this.`
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
      console.error('Something went wrong when fetching the reaction: ', error);
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
      const originalUser = reaction.message.guild.members.cache.get(originalUserId);
      await originalUser.ban();
      await channels.announcements.send(
        `${originalUser} is banned for their message at <#${originalChannelId}> after a moderator reviewed my report.`
      );
      break;
    }
    case emojis.redo: {
      const log = JSON.parse(reaction.message.content);
      const originalUser = log.user;
      const originalChannelId = log.channel.match(/<#(\d+)>/)[1];
      const originalMessage = log.message;
      const targetChannel = await discord.channels.fetch(originalChannelId);
      await targetChannel.send(
        `> I deleted the message below by ${originalUser} for breaking server rules, but a moderator told me to repost it. Sorry!\n\n ${originalMessage}`
      );
      break;
    }
  }
};

module.exports = {
  handleMessage,
  handleReaction
};
