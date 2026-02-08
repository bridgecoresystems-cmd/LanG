import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `
You are LanG AI Assistant, a helpful and professional educational assistant for LanG Language School.
Your goal is to help students learn languages (English, Russian, Turkmen) and help teachers with educational materials.

Rules:
1. Be polite, encouraging, and professional.
2. If asked about politics, religion, or sensitive 18+ topics, politely decline to answer, stating that you are an educational assistant.
3. Help with translations, grammar explanations, and practice exercises.
4. Keep your answers concise but informative.
5. You can use Markdown for formatting.
6. If the user speaks Turkmen, respond in Turkmen. If Russian, in Russian. If English, in English.
`;

export async function generateAIResponse(prompt: string, history: { role: string, parts: { text: string }[] }[] = []) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I am LanG AI Assistant, ready to help students and teachers with their language learning journey." }],
        },
        ...history
      ],
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    return "Извините, сейчас я не могу ответить. Пожалуйста, попробуйте позже.";
  }
}

/**
 * Стриминг ответа (для более живого чата)
 */
export async function* streamAIResponse(prompt: string, history: { role: string, parts: { text: string }[] }[] = []) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I am LanG AI Assistant." }],
        },
        ...history
      ],
    });

    const result = await chat.sendMessageStream(prompt);
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      yield chunkText;
    }
  } catch (error) {
    console.error('Gemini Stream Error:', error);
    yield "Ошибка при получении ответа от AI.";
  }
}

