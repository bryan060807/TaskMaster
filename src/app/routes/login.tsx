import { Link, useFetcher } from 'react-router'
import { useEffect } from 'react'
import { useAuth } from '@/lib/AuthProvider'
import { finishLogin, login, readPostLoginRedirect } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import type { Route } from './+types/login'

export const clientAction = async ({ request }: Route.ClientActionArgs) => {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const data = await login(email, password)

  if (!data?.token) {
    return { error: data.error || 'Login failed' }
  }

  return data
}

export default function Login() {
  const fetcher = useFetcher<typeof clientAction>()
  const { user, loading } = useAuth()

  const error = fetcher.data?.error
  const submitting = fetcher.state === 'submitting'
  const redirectTarget = readPostLoginRedirect()

  useEffect(() => {
    if (fetcher.data?.token) {
      finishLogin(fetcher.data.token, redirectTarget)
      return
    }

    if (!loading && user && !redirectTarget) {
      window.location.href = '/'
    }
  }, [fetcher.data, loading, redirectTarget, user])

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-black p-6 text-white md:p-10">
      <div className="w-full max-w-sm">
        <Card className="border-neutral-800 bg-neutral-900 text-white">
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription className="text-neutral-400">
              Enter your email below to login
            </CardDescription>
          </CardHeader>

          <CardContent>
            <fetcher.Form method="post">
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="border-neutral-700 bg-neutral-800"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    required
                    className="border-neutral-700 bg-neutral-800"
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500"
                  disabled={submitting}
                >
                  {submitting ? 'Logging in...' : 'Login'}
                </Button>
              </div>

              <div className="mt-4 text-center text-sm text-neutral-400">
                Don&apos;t have an account?{' '}
                <Link to="/sign-up" className="text-blue-500 underline">
                  Sign up
                </Link>
              </div>
            </fetcher.Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
