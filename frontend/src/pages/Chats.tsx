import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleAlert, CircleCheck, LogOut, MessageSquareText, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useSession } from '@/hooks/useSession'
import { ApiError, request } from '@/lib/http'
import { supabase } from '@/lib/supabase'
import { LogoMark } from '@/components/Logo'

type CurrentUser = {
  id: string
  email: string
}

export function Chats() {
  const session = useSession()
  const navigate = useNavigate()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [retryCount, setRetryCount] = useState(0)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const isLoading = status === 'loading'

  useEffect(() => {
    if (!session?.access_token) {
      return
    }

    let cancelled = false

    request<CurrentUser>('/me', { accessToken: session.access_token })
      .then((currentUser) => {
        if (!cancelled) {
          setUser(currentUser)
          setStatus('success')
        }
      })
      .catch((requestError: unknown) => {
        if (cancelled) {
          return
        }

        const message = requestError instanceof ApiError
          ? `${requestError.message}${requestError.status ? ` (HTTP ${requestError.status})` : ''}`
          : requestError instanceof Error
            ? requestError.message
            : 'Unable to load your account details.'
        setError(message)
        setUser(null)
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [session?.access_token, retryCount])

  async function handleSignOut() {
    setIsSigningOut(true)
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-svh bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <LogoMark className='size-10`' />
            <div>
              <p className="text-sm font-semibold">Document Copilot</p>
              <p className="text-xs text-muted-foreground">Research workspace</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut} disabled={isSigningOut}>
            <LogOut aria-hidden="true" />
            {isSigningOut ? 'Signing out…' : 'Sign out'}
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_360px] lg:py-14">
        <section>
          <div className="mb-8">
            <p className="mb-2 text-sm font-medium text-muted-foreground">Workspace</p>
            <h1 className="text-3xl font-semibold tracking-tight">Chats</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Your research conversations will live here. The workspace is ready for your first chat.
            </p>
          </div>

          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed bg-background px-6 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
              <MessageSquareText className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-semibold">No chats yet</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Start a conversation to explore company filings and build your research history.
            </p>
            <Button className="mt-5" disabled>
              New chat <span aria-hidden="true">＋</span>
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">Chat creation is coming soon.</p>
          </div>
        </section>

        <aside className="h-fit rounded-2xl border bg-background p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">API connection</p>
              <p className="mt-1 text-xs text-muted-foreground">Authenticated account check</p>
            </div>
            {isLoading ? (
              <RefreshCw className="mt-0.5 size-4 animate-spin text-muted-foreground" aria-label="Loading" />
            ) : error ? (
              <CircleAlert className="mt-0.5 size-4 text-destructive" aria-label="Request failed" />
            ) : (
              <CircleCheck className="mt-0.5 size-4 text-emerald-600" aria-label="Connected" />
            )}
          </div>

          <div className="mt-5 rounded-xl bg-muted/60 p-3">
            <p className="font-mono text-xs text-muted-foreground">GET /me</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isLoading ? 'Checking the backend…' : error ? 'Request failed' : 'Connected'}
            </p>
          </div>

          {error ? (
            <div className="mt-4" role="alert">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                className="mt-3"
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null)
                  setStatus('loading')
                  setRetryCount((count) => count + 1)
                }}
                disabled={isLoading}
              >
                <RefreshCw aria-hidden="true" />
                Try again
              </Button>
            </div>
          ) : isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading your account details…</p>
          ) : user ? (
            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">User ID</dt>
                <dd className="mt-1 break-all font-mono text-xs leading-5">{user.id}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</dt>
                <dd className="mt-1 break-all text-sm">{user.email}</dd>
              </div>
            </dl>
          ) : null}
        </aside>
      </div>
    </main>
  )
}
