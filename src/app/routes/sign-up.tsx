import { Link, useFetcher } from 'react-router'
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

import { finishLogin, readPostLoginRedirect, register } from '@/lib/auth'
import { useEffect } from 'react'

import type { Route } from './+types/sign-up'

export const clientAction = async ({ request }: Route.ClientActionArgs) => {
  const formData = await request.formData()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const repeatPassword = formData.get('repeat-password') as string

  if (!email) {
    return { error: 'Email is required' }
  }

  if (!password) {
    return { error: 'Password is required' }
  }

  if (password !== repeatPassword) {
    return { error: 'Passwords do not match' }
  }

  const data = await register(email, password)

  if (!data?.token) {
    return { error: data.error || 'Signup failed' }
  }

  return data
}

export default function SignUp() {
  const fetcher = useFetcher<typeof clientAction>()
  const redirectTarget = readPostLoginRedirect()

  const error = fetcher.data?.error
  const loading = fetcher.state === 'submitting'

  useEffect(() => {
    if (fetcher.data?.token) {
      finishLogin(fetcher.data.token, redirectTarget)
    }
  }, [fetcher.data, redirectTarget])

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Sign up</CardTitle>
              <CardDescription>Create a new AIBRY account</CardDescription>
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
                      placeholder="m@example.com"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password">Repeat Password</Label>
                    <Input
                      id="repeat-password"
                      name="repeat-password"
                      type="password"
                      required
                    />
                  </div>

                  {error && (
                    <p className="text-sm font-medium text-red-500">{error}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating account...' : 'Sign up'}
                  </Button>
                </div>

                <div className="mt-4 text-center text-sm">
                  Already have an account?{' '}
                  <Link to="/login" className="underline underline-offset-4">
                    Login
                  </Link>
                </div>
              </fetcher.Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
