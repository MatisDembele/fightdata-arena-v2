import type { Metadata } from 'next'
import AdminDashboard from '@/components/AdminDashboard'

// Hidden, unlinked route. Keep it out of search engines.
export const metadata: Metadata = {
  title: 'Admin — Fight Data Arena',
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return <AdminDashboard />
}
