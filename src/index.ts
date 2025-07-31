import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { generateRecords, randomlyModifyRecords } from './generate'
import type { DrumRecord } from './generate'

const PORT = Number(process.env.PORT) || 3000
const NODE_ENV = process.env.NODE_ENV ?? 'development'
const MAX_RECORDS = Number(process.env.MAX_RECORDS_PER_REQUEST) || 10000
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? '*'
const CORS_MAX_AGE = Number(process.env.CORS_MAX_AGE) || 3600

console.log(`🚀 Oracle Data Provider starting on port ${PORT.toString()} in ${NODE_ENV} mode`)

const app = new Hono()

// Middleware
app.use('*', logger())
app.use(
  '*',
  cors({
    origin: CORS_ORIGIN,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: CORS_MAX_AGE,
    credentials: true,
  })
)

let storedRecords: DrumRecord[] = []

app.get('/', (c) => {
  return c.json({
    message: 'Oracle Data Provider API',
    endpoints: {
      'GET /{N}': 'Get N drum records with random modifications',
      Examples: ['GET /10 - Returns 10 drum records', 'GET /50 - Returns 50 drum records'],
    },
  })
})

app.get('/:count', (c) => {
  const countParam = c.req.param('count')
  const count = parseInt(countParam, 10)

  if (isNaN(count) || count < 1 || count > MAX_RECORDS) {
    return c.json(
      {
        error: `Invalid count parameter. Must be a number between 1 and ${MAX_RECORDS.toString()}`,
      },
      400
    )
  }

  try {
    // randomly modify records them to reach the target count
    // or generate fresh records
    let data: DrumRecord[]

    if (storedRecords.length > 0) {
      // random modifications to existing data
      data = randomlyModifyRecords(storedRecords, count)
    } else {
      // fresh records
      data = generateRecords(count)
    }

    // update stored records for next request
    storedRecords = [...data]

    return c.json({
      count: data.length,
      timestamp: new Date().toISOString(),
      data: data,
    })
  } catch (error) {
    return c.json(
      {
        error: 'Failed to generate drum records',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

app.delete('/reset', (c) => {
  storedRecords = []
  return c.json({ message: 'Stored records cleared' })
})

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    storedRecordsCount: storedRecords.length,
    timestamp: new Date().toISOString(),
  })
})

// Error handling
app.onError((err, c) => {
  const errorId = crypto.randomUUID()
  const timestamp = new Date().toISOString()

  // Enhanced error logging
  console.error(`[${timestamp}] [Error ID: ${errorId}] ${err.message}`)
  if (NODE_ENV === 'development') {
    console.error(`[${timestamp}] Stack trace:`, err.stack)
  }

  // Don't expose internal errors in production
  if (NODE_ENV === 'production') {
    return c.json(
      {
        error: {
          message: 'Internal Server Error',
          id: errorId,
          timestamp: timestamp,
        },
      },
      500
    )
  }

  return c.json(
    {
      error: {
        message: err.message,
        stack: err.stack,
        id: errorId,
        timestamp: timestamp,
      },
    },
    500
  )
})

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      status: 404,
      message: 'Not Found',
    },
    404
  )
})

export default {
  port: PORT,
  fetch: app.fetch,
}
