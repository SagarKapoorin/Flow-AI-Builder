import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { config } from './config/env'
import flowRoutes from './routes/flows.routes'
import aiRoutes from './routes/ai.routes'
import { notFound } from './middleware/notFound'
import { errorHandler } from './middleware/errorHandler'
import helmet from 'helmet';
import morgan from 'morgan';

async function bootstrap() {
  try {
    await mongoose.connect(config.mongoUri)
    console.log('MongoDB connected')
  } catch (err) {
    console.error('MongoDB connection error:', err)
    throw err
  }

  const app = express()

  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  )
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/flows', flowRoutes)
  app.use('/api/ai', aiRoutes)

  app.use(notFound)
  app.use(errorHandler)

  app.listen(config.port, () => {
    console.log(`API server listening on http://localhost:${config.port}`)
  })
}

bootstrap().catch((err) => {
  console.error('Failed to start server', err)
  process.exit(1)
})
