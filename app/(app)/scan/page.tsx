'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { scanToken, reasonLabel, type ScanResult } from '@/lib/scan/scan-client'

const SCANNER_ELEMENT_ID = 'qr-reader'
const COOLDOWN_MS = 2000

type Verdict =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'pass'; shortName: string; className: string }
  | { state: 'deny'; reason: string }

export default function ScanPage() {
  const [verdict, setVerdict] = useState<Verdict>({ state: 'idle' })
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const busyRef = useRef(false)
  const lastResultTimeRef = useRef(0)

  const handleDecoded = useCallback(async (decodedText: string) => {
    const now = Date.now()
    if (busyRef.current) return
    if (now - lastResultTimeRef.current < COOLDOWN_MS) return

    busyRef.current = true
    lastResultTimeRef.current = now
    setVerdict({ state: 'checking' })

    const result: ScanResult = await scanToken(decodedText.trim())

    if (result.ok) {
      setVerdict({ state: 'pass', shortName: result.shortName, className: result.className })
    } else {
      setVerdict({ state: 'deny', reason: reasonLabel(result.reason) })
    }

    setTimeout(() => {
      busyRef.current = false
      setVerdict({ state: 'idle' })
    }, 3000)
  }, [])

  useEffect(() => {
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => { handleDecoded(decodedText) },
        () => { /* кадр без QR — молча игнорируем */ }
      )
      .catch(() => {
        setVerdict({ state: 'deny', reason: 'Не удалось получить доступ к камере' })
      })

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [handleDecoded])

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-center text-lg font-semibold">Сканер пропусков</h1>

      <div id={SCANNER_ELEMENT_ID} className="overflow-hidden rounded-lg border" />

      <VerdictBanner verdict={verdict} />
    </div>
  )
}

function VerdictBanner({ verdict }: { verdict: Verdict }) {
  if (verdict.state === 'idle') {
    return (
      <div className="rounded-lg bg-gray-100 p-6 text-center text-gray-500">
        Наведите камеру на QR-код
      </div>
    )
  }

  if (verdict.state === 'checking') {
    return (
      <div className="rounded-lg bg-gray-100 p-6 text-center text-gray-500">
        Проверяем…
      </div>
    )
  }

  if (verdict.state === 'pass') {
    return (
      <div className="rounded-lg bg-green-600 p-6 text-center text-white">
        <p className="text-3xl font-bold">ПРОПУСТИТЬ</p>
        <p className="mt-2 text-lg">{verdict.shortName}</p>
        <p className="text-sm opacity-90">{verdict.className}</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-red-600 p-6 text-center text-white">
      <p className="text-3xl font-bold">НЕ ПРОПУСКАТЬ</p>
      <p className="mt-2 text-lg">{verdict.reason}</p>
    </div>
  )
}
