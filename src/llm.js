const { Anthropic } = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

async function chat(messages) {
  try {
    return chatWithOpenRouter('anthropic/claude-3.5-sonnet', messages);
  } catch (errorOpenrouter) {
    try {
      return chatWithAnthropic('claude-3-5-sonnet-20240620', messages);
    } catch (errorAnthropic) {
      console.error(`Openrouter call failed with ${errorOpenrouter}\nAnthropic call failed with ${errorAnthropic}`);
    }
  }
}

async function chatWithOpenRouter(model, messages) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages
    })
  });
  const responseJson = await response.json();
  return responseJson.choices[0].message.content;
}

async function chatWithAnthropic(model, messages) {
  const response = await anthropic.messages.create({
    max_tokens: 1024,
    messages: messages.map((message) => {
      return { role: 'user', content: message };
    }),
    model
  });
  return response.content[0].text;
}

module.exports = {
  chat
};
