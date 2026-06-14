'use client'
import { LanguageProvider } from '@/lib/i18n'
import AuthProvider from '@/components/AuthProvider'
import type { ReactNode } from 'react'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </LanguageProvider>
  )
}
