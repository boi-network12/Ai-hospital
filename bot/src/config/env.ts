export function validateEnv() {
  const required = ['GEMINI_API_KEY', 'MONGODB_URI'];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export const config = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY!,
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    temperature: 0.7,
    maxOutputTokens: 2048,
  },
  server: {
    port: parseInt(process.env.BOT_PORT || '3002'),
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  },
  medical: {
    emergencyKeywords: [
      'chest pain', 'heart attack', 'stroke', 'difficulty breathing',
      'severe bleeding', 'unconscious', 'suicidal', 'homicidal',
      'severe allergic reaction', 'overdose', 'seizure'
    ],
    redFlagSymptoms: [
      'fever over 103°F', 'stiff neck', 'severe headache',
      'sudden vision loss', 'sudden weakness', 'confusion',
      'severe abdominal pain', 'vomiting blood', 'black stools'
    ],
    restrictedDrugs: [
      'opioids', 'benzodiazepines', 'amphetamine', 'steroids',
      'chemotherapy', 'controlled substances'
    ]
  },
  mongodb: {
    uri: process.env.MONGODB_URI!,
    database: process.env.MONGODB_DATABASE || 'neuromed-ai',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  }
};