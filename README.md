# @api3/discord-bot

## config.json

### channelIds

* `announcements`: The channel where deleted messages and banned users are announced. The value is the channel's ID.
* `logs`: The channel where messages deleted by the bot are posted. The value is the channel's ID.
* `prompt`: The channel that influences the bot's behavior based on the latest message. The value is the channel's ID.

### emojis

* `banEmoji`: If someone reacts with the `banEmoji.name` emoji to a message in the `logs` channel, the author of the original message will be banned. `banEmoji.identifier` is the unique identifier for the emoji.
* `redoDeletionEmoji`: If someone reacts with the `redoDeletionEmoji.name` emoji to a message in the `logs` channel, the original message will be reposted to the corresponding channel. `redoDeletionEmoji.identifier` is the unique identifier for the emoji.

### roleIds

* `api3-bot-immune`: Users with this specific role will be immune to the bot. The value is the role's ID.
