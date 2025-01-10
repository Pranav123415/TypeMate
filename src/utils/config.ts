interface Config {
  geminiApiKey: string;
  mongodbUri: string;
}

if (!process.env.VITE_GEMINI_API_KEY) {
  throw new Error('VITE_GEMINI_API_KEY is not defined');
}

if (!process.env.VITE_MONGODB_URI) {
  throw new Error('VITE_MONGODB_URI is not defined');
}

export const config: Config = {
  geminiApiKey: process.env.VITE_GEMINI_API_KEY,
  mongodbUri: process.env.VITE_MONGODB_URI
}; 