import { redirect } from 'react-router'
import { clearToken } from '@/lib/auth'

export async function clientLoader() {
  clearToken()
  return redirect('/login')
}
