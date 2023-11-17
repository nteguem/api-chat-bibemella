const OpenAI = require("openai");

const openai = new OpenAI({
  organization: "org-V5aBqqGFuhTfurCJCMW74MjY",
  apiKey: process.env.OPENAI_API_KEY,
});

async function chatCompletion(context) {
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: "Vous etes un assistant personnel de la fondation bibemella." },
      ...context,
    ],
    model: "gpt-3.5-turbo",
  });

  
  if (completion.choices) {
    return { success: true, completion: completion.choices[0], tokens: completion.usage.completion_tokens };
  } else {
    return { success: false };
  }
}

module.exports = chatCompletion;
