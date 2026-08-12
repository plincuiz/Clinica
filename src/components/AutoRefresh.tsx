'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AutoRefresh() {
  const router = useRouter()

  useEffect(() => {
    let last = Date.now()
    const timer = setInterval(() => {
      let ms = 15000
      try {
        const v = localStorage.getItem('clinica_refresh_ms')
        if (v === '0') ms = 0
        else if (v && Number(v) > 0) ms = Number(v)
      } catch {}
      if (!ms) return
      if (Date.now() - last >= ms) {
        last = Date.now()
        router.refresh()
      }
    }, 5000)
    return () => clearInterval(timer)
  }, [router])

  return null
}
