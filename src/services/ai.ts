import * as GenAI from "@google/genai";

/**
 * Vite requires 'import.meta.env' for environment variables in the browser.
 * Ensure your .env (and Vercel environment variables) has VITE_GEMINI_API_KEY.
 */
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * We use a "Nullish Coalescing" check here. 
 * If the constructor is missing due to a build-time export error, 
 * this prevents the entire app from crashing with "void 0 is not a constructor".
 */
const genAI = (GenAI as any).GoogleGenerativeAI 
  ? new (GenAI as any).GoogleGenerativeAI(apiKey) 
  : null;

export async function breakDownTask(taskTitle: string): Promise<string[]> {
  // Graceful exit if the AI client failed to initialize
  if (!genAI) {
    console.error("Gemini AI client failed to initialize. Check build exports.");
    return [
      "Take a deep breath", 
      "Identify the very first tiny movement", 
      "Do just that one thing"
    ];
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: 
      "You are a gentle, structured assistant helping someone with autism manage executive dysfunction. " +
      "Keep steps extremely actionable, short, and clear. " +
      "Break down tasks into 3 to 5 very small, manageable steps. " +
      "Output ONLY a JSON array of strings."
  });

  try {
    const prompt = `The user is overwhelmed. Break down this task into 3-5 very small, specific, and manageable steps: "${taskTitle}"`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const responseText = result.response.text();
    if (!responseText) return [];
    
    const steps = JSON.parse(responseText);
    return Array.isArray(steps) ? steps : [steps.toString()];
    
  } catch (error) {
    console.error("Failed to break down task with Gemini:", error);
    return [
      "Take a deep breath", 
      "Identify the very first tiny movement", 
      "Do just that one thing"
    ];
  }
}