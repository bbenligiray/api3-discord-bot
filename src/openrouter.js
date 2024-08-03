async function chat(model, messages, apiKey) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
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

module.exports = {
  chat
};
