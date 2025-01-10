import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

export async function generateText(): Promise<string[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = 'Generate a paragraph of random text for a typing test. Make it interesting but use common words. Return only the text, no additional context.';
  
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  return text.split(' ').filter(word => word.trim() !== '');
}