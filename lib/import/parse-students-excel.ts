import 'server-only'
import * as XLSX from 'xlsx'

export type ParsedStudentRow = {
  rowNumber: number       // номер строки в файле (для отчёта об ошибках)
  fullName: string
  birthDate: string | null // ISO 'YYYY-MM-DD' или null — дата не обязательна
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

/** Возвращает распознанную дату, либо null — и для "ячейка пустая",
 *  и для "формат не распознан" (оба случая не ошибка, раз дата необязательна). */
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
  if (!str) return null

  let m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`

  m = str.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})$/)
  if (m) {
    const [, d, mo, y] = m
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  return null
}

function isPlausibleBirthYear(iso: string): boolean {
  const year = Number(iso.slice(0, 4))
  const currentYear = new Date().getFullYear()
  return year >= currentYear - 20 && year <= currentYear - 5
}

function isPlausibleFullName(name: string): boolean {
  return /^[А-ЯЁа-яёA-Za-z\-\s]{4,100}$/.test(name) && name.trim().split(/\s+/).length >= 2
}

/** Ключ дедупликации: если дата рождения известна — учитываем её (точнее),
 *  если нет — дедуплицируем просто по ФИО внутри класса. */
export function studentDedupeKey(fullName: string, birthDate: string | null): string {
  const name = fullName.trim().toLowerCase()
  return birthDate ? `${name}|${birthDate}` : name
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
  const dateCol = findColumnIndex(headerRow, HEADER_ALIASES.birthDate) // может не найтись — это нормально

  if (nameCol === -1) {
    return {
      rows: [],
      errors: [
        {
          rowNumber: 1,
          raw: headerRow,
          reason: 'Не найдена колонка "ФИО" в заголовке. Проверьте первую строку файла.',
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
    const fullName = String(fullNameRaw ?? '').trim().replace(/\s+/g, ' ')

    if (!fullName) {
      errors.push({ rowNumber, raw, reason: 'Пустое ФИО' })
      continue
    }
    if (!isPlausibleFullName(fullName)) {
      errors.push({ rowNumber, raw, reason: `Похоже на некорректное ФИО: "${fullName}"` })
      continue
    }

    let birthDate: string | null = null
    if (dateCol !== -1) {
      const birthDateRaw = raw[dateCol]
      const hasValue = birthDateRaw != null && String(birthDateRaw).trim() !== ''
      if (hasValue) {
        const parsed = parseBirthDate(birthDateRaw)
        if (!parsed) {
          errors.push({
            rowNumber,
            raw,
            reason: `Не удалось распознать дату рождения: "${String(birthDateRaw)}" (оставьте ячейку пустой, если дату не указываете)`,
          })
          continue
        }
        if (!isPlausibleBirthYear(parsed)) {
          errors.push({
            rowNumber,
            raw,
            reason: `Дата рождения выглядит неправдоподобно для школьника: ${parsed}`,
          })
          continue
        }
        birthDate = parsed
      }
      // пустая ячейка при существующей колонке — не ошибка, birthDate остаётся null
    }

    const dedupeKey = studentDedupeKey(fullName, birthDate)
    if (seenInFile.has(dedupeKey)) {
      errors.push({ rowNumber, raw, reason: 'Дубликат строки внутри файла' })
      continue
    }
    seenInFile.add(dedupeKey)

    rows.push({ rowNumber, fullName, birthDate })
  }

  return { rows, errors }
}
