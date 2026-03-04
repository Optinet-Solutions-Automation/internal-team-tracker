import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Avatar from '@/components/Avatar'

export default async function PendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single()

  if (profile?.status === 'approved') redirect('/')

  const isRejected = profile?.status === 'rejected'

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  const name = user.user_metadata?.full_name ?? user.email ?? 'You'
  const requestedDate = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-yt-bg p-4">

      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className={`absolute -left-32 -top-32 h-96 w-96 rounded-full blur-3xl opacity-30 ${isRejected ? 'bg-red-300 dark:bg-red-900/40' : 'bg-yt-red/30'}`} />
        <div className={`absolute -bottom-32 -right-32 h-96 w-96 rounded-full blur-3xl opacity-30 ${isRejected ? 'bg-orange-200 dark:bg-orange-900/30' : 'bg-yt-red/20'}`} />
        <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 blur-2xl" />
      </div>

      <div className="w-full max-w-sm">

        {/* App logo */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-yt-card shadow-sm ring-1 ring-yt-border">
            <svg className="h-5 w-5 text-yt-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-3xl bg-yt-card shadow-xl shadow-yt-text/5 ring-1 ring-yt-border">

          {/* Top accent */}
          <div className={`h-1 w-full ${isRejected ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-yt-red'}`} />

          <div className="p-8">

            {/* Avatar */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                {!isRejected && (
                  <>
                    <span className="absolute inset-0 animate-ping rounded-full bg-yt-red/25" style={{ animationDuration: '2s' }} />
                    <span className="absolute inset-0 animate-ping rounded-full bg-yt-red/15" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                  </>
                )}
                <div className="relative ring-4 ring-yt-card rounded-full shadow-lg">
                  <Avatar
                    avatarUrl={user.user_metadata?.avatar_url}
                    name={name}
                    size="xl"
                  />
                </div>
                <span className={`absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-yt-card shadow-sm ${isRejected ? 'bg-red-500' : 'bg-amber-400'}`}>
                  {isRejected ? (
                    <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-5 text-center">
              <h1 className="text-xl font-bold text-yt-text">
                {isRejected ? 'Access denied' : "You're in the queue"}
              </h1>
              <p className="mt-1 text-sm text-yt-text-secondary">{name}</p>
            </div>

            {/* Status panel */}
            <div className={`mb-5 rounded-2xl p-4 ${isRejected ? 'bg-red-50 dark:bg-red-950/40' : 'bg-amber-50 dark:bg-amber-950/40'}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isRejected ? 'bg-red-100 dark:bg-red-900/40' : 'bg-amber-100 dark:bg-amber-900/40'}`}>
                  {isRejected ? (
                    <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isRejected ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'}`}>
                    {isRejected ? 'Your request was not approved' : 'Awaiting admin approval'}
                  </p>
                  <p className={`mt-0.5 text-xs leading-relaxed ${isRejected ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {isRejected
                      ? 'Contact your admin if you think this is a mistake.'
                      : `Requested access on ${requestedDate}`}
                  </p>
                </div>
              </div>
            </div>

            {!isRejected && (
              <p className="mb-5 text-center text-sm leading-relaxed text-yt-text-secondary">
                An admin will review your request. Once approved, you will have full access to the workspace.
              </p>
            )}

            {/* Progress dots — pending only */}
            {!isRejected && (
              <div className="mb-6 flex items-center justify-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-yt-red" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-yt-red" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-yt-red" style={{ animationDelay: '300ms' }} />
              </div>
            )}

            {/* Sign out */}
            <form action={signOut}>
              <button
                type="submit"
                className="w-full rounded-xl border border-yt-border py-3 text-sm font-medium text-yt-text-secondary transition-all hover:bg-yt-bg-alt hover:text-yt-text active:scale-[0.98]"
              >
                Sign out
              </button>
            </form>

          </div>
        </div>

        <p className="mt-5 text-center text-xs text-yt-text-secondary">Internal Team Tracker</p>
      </div>
    </div>
  )
}
