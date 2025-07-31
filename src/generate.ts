import { randomBytes, randomUUID } from 'crypto'

export interface DrumRecord {
  drumId: string
  batchCode: string
  weight: number
  unitOfMeasurement: string
  pourDateTimestampYear: number
  pourDateTimestampMonth: number
  pourDateTimestampDay: number
  pourDateTimestampHour: number
  pourDateTimestampMinute: number
  pourDateTimestampSecond: number
  pourDateTimestampTimezoneUTCOffset: number
  tamperSealTimestampYear: number
  tamperSealTimestampMonth: number
  tamperSealTimestampDay: number
  tamperSealTimestampHour: number
  tamperSealTimestampMinute: number
  tamperSealTimestampSecond: number
  tamperSealTimestampTimezoneUTCOffset: number
  tamperStatusIsSealed: boolean
  tamperStatusIsTampered: boolean
  locationDataIsUploaded: boolean
  locationDataUploaderUserId: string
  facialRecognitionScanHash: string
}

function randomHex(bytes: number): string {
  return randomBytes(bytes).toString('hex')
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function generateRecord(): DrumRecord {
  const pourDate = randomDate(new Date(2025, 0, 1), new Date())

  // within 0–2 hours after pour
  const tamperDate = new Date(pourDate.getTime() + Math.random() * 2 * 60 * 60 * 1000)
  const sealed = Math.random() > 0.2

  return {
    drumId: `drum-${randomUUID()}`,
    batchCode: `batch-${randomUUID()}`,
    weight: parseFloat((10 + Math.random() * 40).toFixed(2)),
    unitOfMeasurement: 'kg',
    pourDateTimestampYear: pourDate.getFullYear(),
    pourDateTimestampMonth: pourDate.getMonth() + 1,
    pourDateTimestampDay: pourDate.getDate(),
    pourDateTimestampHour: pourDate.getHours(),
    pourDateTimestampMinute: pourDate.getMinutes(),
    pourDateTimestampSecond: pourDate.getSeconds(),
    pourDateTimestampTimezoneUTCOffset: 9,
    tamperSealTimestampYear: tamperDate.getFullYear(),
    tamperSealTimestampMonth: tamperDate.getMonth() + 1,
    tamperSealTimestampDay: tamperDate.getDate(),
    tamperSealTimestampHour: tamperDate.getHours(),
    tamperSealTimestampMinute: tamperDate.getMinutes(),
    tamperSealTimestampSecond: tamperDate.getSeconds(),
    tamperSealTimestampTimezoneUTCOffset: 9,
    tamperStatusIsSealed: sealed,
    tamperStatusIsTampered: !sealed,
    locationDataIsUploaded: Math.random() > 0.3,
    locationDataUploaderUserId: `user-${randomUUID()}`,
    facialRecognitionScanHash: randomHex(32),
  }
}

export function generateRecords(n: number): DrumRecord[] {
  const data: DrumRecord[] = []
  for (let i = 0; i < n; i++) {
    data.push(generateRecord())
  }
  return data
}

// Randomly modify existing records by deleting, updating, and adding
export function randomlyModifyRecords(records: DrumRecord[], targetCount: number): DrumRecord[] {
  const data = [...records]

  // If we have more records than target, randomly delete some
  while (data.length > targetCount && data.length > 0) {
    const randomIndex = Math.floor(Math.random() * data.length)
    data.splice(randomIndex, 1)
  }

  // If we have fewer records than target, add new ones
  while (data.length < targetCount) {
    data.push(generateRecord())
  }

  // Randomly update some existing records (update about 10-30% of records)
  const updateCount = Math.floor(data.length * (0.1 + Math.random() * 0.2))
  for (let i = 0; i < updateCount; i++) {
    const randomIndex = Math.floor(Math.random() * data.length)
    // Update some fields randomly
    const record = data[randomIndex]

    // Update weight
    if (Math.random() > 0.5) {
      record.weight = parseFloat((10 + Math.random() * 40).toFixed(2))
    }

    // Update tamper status
    if (Math.random() > 0.7) {
      const sealed = Math.random() > 0.2
      record.tamperStatusIsSealed = sealed
      record.tamperStatusIsTampered = !sealed
    }

    // Update location data
    if (Math.random() > 0.6) {
      record.locationDataIsUploaded = Math.random() > 0.3
      record.locationDataUploaderUserId = `user-${randomUUID()}`
    }

    // Update facial recognition hash
    if (Math.random() > 0.8) {
      record.facialRecognitionScanHash = randomHex(32)
    }
  }

  return data
}
