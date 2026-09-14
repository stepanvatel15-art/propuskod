import 'server-only'
import * as XLSX from 'xlsx'

export type ParsedStudentRow = {
  rowNumber: number       // номер строки в файле (для отчёта об ошибках)
  fullName: string
  birthDate: string       // ISO 'YYYY-MM-DD'
}

export type ParseRowError = {
  rowNumber: number
  raw: unknown
  reason: string
}

export type ParseResult = {
  rows: ParsedStudentRow[]
  errors: ParseRowError[]
}

const HEADER_ALIASES = {
  fullName: ['фио', 'фамилия имя отчество', 'ученик', 'name'],
  birthDate: ['дата рождения', 'др', 'birth date', 'birthdate'],
}

function normalizeHeader(v: unknown): string {
  return String(v ?? '').trim().toLowerCase()
}

function findColumnIndex(headerRow: unknown[], aliases: string[]): number {
  return headerRow.findIndex((cell) => aliases.includes(normalizeHeader(cell)))
}

function parseBirthDate(raw: unknown): string | null {
  if (raw == null || raw === '') return null

  if (typeof raw === 'number') {
    const parsed = XLSX.SSF.parse_date_code(raw)
    if (!parsed) return null
    const mm = String(parsed.m).padStart(2, '0')
    const dd = String(parsed.d).padStart(2, '0')
    return `${parsed.y}-${mm}-${dd}`
  }

  const str = String(raw).trim()

  let m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`

  m = str.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})$/)
  if (m) {
    const [, d, mo, y] = m
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  return null
}

function isPlausibleFullName(name: string): boolean {
  return /^[А-ЯЁа-яёA-Za-z\-\s]{4,100}$/.test(name) && name.trim().split(/\s+/).length >= 2
}

export function parseStudentsExcel(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  const data: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    blankrows: false,
  })

  if (data.length === 0) {
    return { rows: [], errors: [{ rowNumber: 0, raw: null, reason: 'Файл пуст' }] }
  }

  const headerRow = data[0]
  const nameCol = findColumnIndex(headerRow, HEADER_ALIASES.fullName)
  const dateCol = findColumnIndex(headerRow, HEADER_ALIASES.birthDate)

  if (nameCol === -1 || dateCol === -1) {
    return {
      rows: [],
      errors: [
        {
          rowNumber: 1,
          raw: headerRow,
          reason:
            'Не найдены колонки "ФИО" и "Дата рождения" в заголовке. Проверьте первую строку файла.',
        },
      ],
    }
  }

  const rows: ParsedStudentRow[] = []
  const errors: ParseRowError[] = []
  const seenInFile = new Set<string>()

  for (let i = 1; i < data.length; i++) {
    const rowNumber = i + 1
    const raw = data[i]

    const fullNameRaw = raw[nameCol]
    const birthDateRaw = raw[dateCol]

    const fullName = String(fullNameRaw ?? '').trim().replace(/\s+/g, ' ')

    if (!fullName) {
      errors.push({ rowNumber, raw, reason: 'Пустое ФИО' })
      continue
    }
    if (!isPlausibleFullName(fullName)) {
      errors.push({ rowNumber, raw, reason: `Похоже на некорректное ФИО: "${fullName}"` })
      continue
    }

    const birthDate = parseBirthDate(birthDateRaw)
    if (!birthDate) {
      errors.push({
        rowNumber,
        raw,
        reason: `Не удалось распознать дату рождения: "${String(birthDateRaw)}"`,
      })
      continue
    }

    const birthYear = Number(birthDate.slice(0, 4))
    const currentYear = new Date().getFullYear()
    if (birthYear < currentYear - 20 || birthYear > currentYear - 5) {
      errors.push({
        rowNumber,
        raw,
        reason: `Дата рождения выглядит неправдоподобно для школьника: ${birthDate}`,
      })
      continue
    }

    const dedupeKey = `${fullName.toLowerCase()}|${birthDate}`
    if (seenInFile.has(dedupeKey)) {
      errors.push({ rowNumber, raw, reason: 'Дубликат строки внутри файла' })
      continue
    }
    seenInFile.add(dedupeKey)

    rows.push({ rowNumber, fullName, birthDate })
  }

  return { rows, errors }
}
