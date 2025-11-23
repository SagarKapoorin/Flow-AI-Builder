import dotenv from 'dotenv'
dotenv.config()
//this funciton load env config for db and ai
export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/refoldai',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  openaiImageModel: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
}
if (!config.mongoUri) {
  console.warn('MONGODB_URI is not set, using default local URI')
}
if (!config.openaiApiKey) {
  console.warn('OPENAI_API_KEY is not set, AI endpoints will fail until configured.')
}
