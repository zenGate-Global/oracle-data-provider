import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test'

const BASE_URL = 'http://localhost:3000'

describe('Oracle Data Provider API', () => {
  // Reset stored records before each test
  beforeEach(async () => {
    await fetch(`${BASE_URL}/reset`, { method: 'DELETE' })
  })

  describe('GET /', () => {
    it('should return API info and available endpoints', async () => {
      const response = await fetch(BASE_URL)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Oracle Data Provider API')
      expect(data.endpoints).toBeDefined()
      expect(data.endpoints['GET /{N}']).toBeDefined()
    })
  })

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await fetch(`${BASE_URL}/health`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data.storedRecordsCount).toBeDefined()
      expect(data.timestamp).toBeDefined()
    })
  })

  describe('GET /:count', () => {
    it('should return the requested number of drum records', async () => {
      const count = 5
      const response = await fetch(`${BASE_URL}/${count}`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.count).toBe(count)
      expect(data.data).toHaveLength(count)
      expect(data.timestamp).toBeDefined()
    })

    it('should return drum records with correct structure', async () => {
      const response = await fetch(`${BASE_URL}/1`)
      const data = await response.json()
      const record = data.data[0]

      expect(record.drumId).toMatch(/^drum-/)
      expect(record.batchCode).toMatch(/^batch-/)
      expect(typeof record.weight).toBe('number')
      expect(record.unitOfMeasurement).toBe('kg')
      expect(typeof record.pourDateTimestampYear).toBe('number')
      expect(typeof record.pourDateTimestampMonth).toBe('number')
      expect(typeof record.pourDateTimestampDay).toBe('number')
      expect(typeof record.tamperStatusIsSealed).toBe('boolean')
      expect(typeof record.tamperStatusIsTampered).toBe('boolean')
      expect(typeof record.locationDataIsUploaded).toBe('boolean')
      expect(record.locationDataUploaderUserId).toMatch(/^user-/)
      expect(record.facialRecognitionScanHash).toHaveLength(64) // 32 bytes = 64 hex chars
    })

    it('should return 400 for invalid count (non-numeric)', async () => {
      const response = await fetch(`${BASE_URL}/abc`)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should return 400 for count less than 1', async () => {
      const response = await fetch(`${BASE_URL}/0`)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should return 400 for count greater than MAX_RECORDS', async () => {
      const response = await fetch(`${BASE_URL}/99999`)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('10000')
    })

    it('should modify records on subsequent requests', async () => {
      // First request generates fresh records
      const response1 = await fetch(`${BASE_URL}/10`)
      const data1 = await response1.json()

      // Second request should modify stored records
      const response2 = await fetch(`${BASE_URL}/10`)
      const data2 = await response2.json()

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      expect(data1.count).toBe(10)
      expect(data2.count).toBe(10)

      // Timestamps should be different
      expect(data1.timestamp).not.toBe(data2.timestamp)
    })

    it('should handle count changes between requests', async () => {
      // First request with 10 records
      await fetch(`${BASE_URL}/10`)

      // Second request with 5 records (should reduce)
      const response = await fetch(`${BASE_URL}/5`)
      const data = await response.json()

      expect(data.count).toBe(5)
      expect(data.data).toHaveLength(5)
    })
  })

  describe('DELETE /reset', () => {
    it('should clear stored records', async () => {
      // First, generate some records
      await fetch(`${BASE_URL}/10`)

      // Reset
      const resetResponse = await fetch(`${BASE_URL}/reset`, { method: 'DELETE' })
      const resetData = await resetResponse.json()

      expect(resetResponse.status).toBe(200)
      expect(resetData.message).toBe('Stored records cleared')

      // Verify health shows 0 stored records
      const healthResponse = await fetch(`${BASE_URL}/health`)
      const healthData = await healthResponse.json()

      expect(healthData.storedRecordsCount).toBe(0)
    })
  })

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await fetch(`${BASE_URL}/unknown/route`)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.status).toBe(404)
      expect(data.message).toBe('Not Found')
    })
  })

  describe('CORS Headers', () => {
    it('should include CORS headers in response', async () => {
      const response = await fetch(BASE_URL, {
        headers: {
          Origin: 'http://example.com',
        },
      })

      expect(response.headers.get('access-control-allow-origin')).toBeDefined()
    })

    it('should handle OPTIONS preflight request', async () => {
      const response = await fetch(BASE_URL, {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://example.com',
          'Access-Control-Request-Method': 'GET',
        },
      })

      expect(response.status).toBe(204)
    })
  })
})
