async function chatWithLlm(messages, apiKey) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: messages
    })
  });

  const llmResponse = await response.json();

  return llmResponse.choices[0].message.content;
}

module.exports = {
  chatWithLlm
};
