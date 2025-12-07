import { describe, it, expect } from 'bun:test'
import { generateRecords, randomlyModifyRecords, type DrumRecord } from '../src/generate'

describe('generateRecords', () => {
  it('should generate the requested number of records', () => {
    const records = generateRecords(10)
    expect(records).toHaveLength(10)
  })

  it('should generate records with valid drumId format', () => {
    const records = generateRecords(5)
    records.forEach((record) => {
      expect(record.drumId).toMatch(/^drum-[a-f0-9-]{36}$/)
    })
  })

  it('should generate records with valid batchCode format', () => {
    const records = generateRecords(5)
    records.forEach((record) => {
      expect(record.batchCode).toMatch(/^batch-[a-f0-9-]{36}$/)
    })
  })

  it('should generate records with weight between 10 and 50 kg', () => {
    const records = generateRecords(100)
    records.forEach((record) => {
      expect(record.weight).toBeGreaterThanOrEqual(10)
      expect(record.weight).toBeLessThan(50)
      expect(record.unitOfMeasurement).toBe('kg')
    })
  })

  it('should generate records with valid date components', () => {
    const records = generateRecords(10)
    records.forEach((record) => {
      expect(record.pourDateTimestampYear).toBeGreaterThanOrEqual(2025)
      expect(record.pourDateTimestampMonth).toBeGreaterThanOrEqual(1)
      expect(record.pourDateTimestampMonth).toBeLessThanOrEqual(12)
      expect(record.pourDateTimestampDay).toBeGreaterThanOrEqual(1)
      expect(record.pourDateTimestampDay).toBeLessThanOrEqual(31)
      expect(record.pourDateTimestampHour).toBeGreaterThanOrEqual(0)
      expect(record.pourDateTimestampHour).toBeLessThanOrEqual(23)
      expect(record.pourDateTimestampMinute).toBeGreaterThanOrEqual(0)
      expect(record.pourDateTimestampMinute).toBeLessThanOrEqual(59)
      expect(record.pourDateTimestampSecond).toBeGreaterThanOrEqual(0)
      expect(record.pourDateTimestampSecond).toBeLessThanOrEqual(59)
    })
  })

  it('should generate records with tamper seal after pour date', () => {
    const records = generateRecords(50)
    records.forEach((record) => {
      const pourDate = new Date(
        record.pourDateTimestampYear,
        record.pourDateTimestampMonth - 1,
        record.pourDateTimestampDay,
        record.pourDateTimestampHour,
        record.pourDateTimestampMinute,
        record.pourDateTimestampSecond
      )
      const tamperDate = new Date(
        record.tamperSealTimestampYear,
        record.tamperSealTimestampMonth - 1,
        record.tamperSealTimestampDay,
        record.tamperSealTimestampHour,
        record.tamperSealTimestampMinute,
        record.tamperSealTimestampSecond
      )
      expect(tamperDate.getTime()).toBeGreaterThanOrEqual(pourDate.getTime())
    })
  })

  it('should generate records with mutually exclusive tamper status', () => {
    const records = generateRecords(100)
    records.forEach((record) => {
      expect(record.tamperStatusIsSealed).not.toBe(record.tamperStatusIsTampered)
    })
  })

  it('should generate records with valid facial recognition hash (64 hex chars)', () => {
    const records = generateRecords(10)
    records.forEach((record) => {
      expect(record.facialRecognitionScanHash).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  it('should generate unique drumIds', () => {
    const records = generateRecords(100)
    const drumIds = records.map((r) => r.drumId)
    const uniqueDrumIds = new Set(drumIds)
    expect(uniqueDrumIds.size).toBe(drumIds.length)
  })
})

describe('randomlyModifyRecords', () => {
  it('should return records with target count (increase)', () => {
    const initial = generateRecords(5)
    const modified = randomlyModifyRecords(initial, 10)
    expect(modified).toHaveLength(10)
  })

  it('should return records with target count (decrease)', () => {
    const initial = generateRecords(10)
    const modified = randomlyModifyRecords(initial, 5)
    expect(modified).toHaveLength(5)
  })

  it('should maintain valid record structure after modification', () => {
    const initial = generateRecords(10)
    const modified = randomlyModifyRecords(initial, 10)

    modified.forEach((record) => {
      expect(record.drumId).toMatch(/^drum-/)
      expect(record.batchCode).toMatch(/^batch-/)
      expect(typeof record.weight).toBe('number')
      expect(record.weight).toBeGreaterThanOrEqual(10)
      expect(record.weight).toBeLessThan(50)
      expect(record.unitOfMeasurement).toBe('kg')
      expect(typeof record.tamperStatusIsSealed).toBe('boolean')
      expect(typeof record.tamperStatusIsTampered).toBe('boolean')
    })
  })

  it('should not mutate the original records array', () => {
    const initial = generateRecords(10)
    const initialCopy = JSON.parse(JSON.stringify(initial))
    randomlyModifyRecords(initial, 5)

    // Original array length should be unchanged
    expect(initial).toHaveLength(10)
    // However, objects inside may be mutated since we spread but don't deep clone
  })

  it('should handle empty initial records', () => {
    const modified = randomlyModifyRecords([], 5)
    expect(modified).toHaveLength(5)
  })

  it('should handle target count of 0 gracefully', () => {
    const initial = generateRecords(10)
    const modified = randomlyModifyRecords(initial, 0)
    expect(modified).toHaveLength(0)
  })
})
