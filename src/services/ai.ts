import { GoogleGenAI } from '@google/genai'

/**
 * Vite requires 'import.meta.env' for environment variables in the browser.
 * Ensure your .env (and Vercel environment variables) has VITE_GEMINI_API_KEY.
 */
const apiKey = import.meta.env.VITE_GEMINI_API_KEY

const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null

export async function breakDownTask(taskTitle: string): Promise<string[]> {
  if (!genAI) {
    console.error('Gemini AI client failed to initialize.')
    return [
      'Take a deep breath',
      'Identify the very first tiny movement',
      'Do just that one thing',
    ]
  }

  try {
    const prompt = `The user is overwhelmed. Break down this task into 3-5 very small, specific, and manageable steps: "${taskTitle}"`

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a gentle, structured assistant helping someone with autism manage executive dysfunction. ' +
          'Keep steps extremely actionable, short, and clear. ' +
          'Break down tasks into 3 to 5 very small, manageable steps. ' +
          'Output ONLY a JSON array of strings.',
        responseMimeType: 'application/json',
      },
    })

    const responseText = result.text
    if (!responseText) return []

    const steps = JSON.parse(responseText)
    return Array.isArray(steps) ? steps.map(String) : [String(steps)]
  } catch (error) {
    console.error('Failed to break down task with Gemini:', error)
    return [
      'Take a deep breath',
      'Identify the very first tiny movement',
      'Do just that one thing',
    ]
  }
}
