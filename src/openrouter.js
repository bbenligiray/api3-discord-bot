async function chat(model, messages, apiKey) {
  try {
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseJson = await response.json();
    return { succces: true, response: responseJson.choices[0].message.content };
  } catch (error) {
    console.error('Error making API call:', error);
    return { succces: false, response: '' };
  }
}

module.exports = {
  chat
};
