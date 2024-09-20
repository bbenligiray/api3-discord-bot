# @api3/discord-bot

## Intents

Intents are used to specify which events bot will receive from the Discord gateway.

- `GatewayIntentBits.Guilds`: Allows the bot to receive events related to server activities, such as role updates, channel creations, and deletions.
- `GatewayIntentBits.GuildMessages`: Enables the bot to receive events related to messages sent in guild text channels, including message creation, updates, and deletions.
- `GatewayIntentBits.MessageContent`: Permits the bot to access the content of messages (`message.content`).
- `GatewayIntentBits.GuildMessageReactions`: Allows the bot to receive events related to message reactions, such as when someone reacts to a message.

## Partials

It is possible for some Discord events (such as messages, reactions, etc.) to be not fully cached, meaning the bot may not receive the complete data.
Partials allow the bot to handle these events even with incomplete data.

- `Partials.Message`: For handling the messages events that are not fully cached.
- `Partials.Channel`: For handling the channal events that are not fully cached.
- `Partials.Reaction`: For handling the reaction events that are not fully cached.

## config.json

### channelIds

- `announcements`: The channel where deleted messages and banned users are announced.
  The value is the channel's ID.
- `logs`: The channel where messages deleted by the bot are posted.
  The value is the channel's ID.
- `prompt`: The channel that influences the bot's behavior based on the latest message.
  The value is the channel's ID.

### emojis

- `ban`: If someone reacts with the `emojis.ban` emoji to a message in the `logs` channel, the author of the original message will be banned.
- `redo`: If someone reacts with the `emoji.redo` emoji to a message in the `logs` channel, the original message will be reposted to the corresponding channel.

### roleIds

- `api3-bot-immune`: Users with this specific role will be immune to the bot. The value is the role's ID.
