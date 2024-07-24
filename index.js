require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { Anthropic } = require('@anthropic-ai/sdk');
const { rules } = require('./rules');

async function main() {
    const discord = new Client(
        {
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });
    await discord.login(process.env.DISCORD_TOKEN);

    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const logsChannel = await discord.channels.fetch('1263779305826291712');

    discord.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        const response = await anthropic.messages.create({
            max_tokens: 1024,
            system: `You are a content moderator for a Discord server. The server rules are: ${rules}`,
            messages: [{ role: 'user', content: `Does this message violate the server rules? Respond with only 'yes' or 'no', followed by a one-sentence reasoning: "${message.content}"` }],
            model: 'claude-3-5-sonnet-20240620',
        });

        const isBannable = response.content[0].text.trim().substring(0, 3).toLowerCase() === 'yes';
        if (isBannable) {
            await logsChannel.send(`${message.author} at <#${message.channel.id}>\nMessage: ${message.content}\nReason: ${response.content[0].text.trim()}`);
            await message.delete();
        }
    });
}

main();

