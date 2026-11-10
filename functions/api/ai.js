export async function onRequestPost({ request, env }) {
  const { prompt } = await request.json();
  if (!prompt || prompt.length > 600) {
    return new Response('Bad request', { status: 400 });
  }

  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'system',
          content:
            'Ты — астролог. Обращайся к пользователю лично, на «ты». Пиши строго на русском. Максимум 2-3 предложения, заканчивай мысль точкой.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 400,
    }),
  });

  return new Response(r.body, {
    status: r.status,
    headers: { 'Content-Type': 'application/json' },
  });
}