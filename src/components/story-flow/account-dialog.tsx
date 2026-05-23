import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Form,
} from '#/components/ui/form'
import { Input } from '#/components/ui/input'
import {
  continueAnonymously,
  requestPasswordReset,
  signInWithEmailPassword,
  signOutOfPermanentAccount,
  upgradeAnonymousUser,
} from '#/lib/supabase-auth'
import { useAuthStore } from '#/state/auth'
import { useForm } from '@tanstack/react-form'
import { CircleCheck, KeyRound, LogIn, LogOut, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import * as z from 'zod'

type AuthMode = 'upgrade' | 'sign-in' | 'reset-password'

const accountFormSchema = z.object({
  confirmPassword: z.string(),
  email: z.email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
})

export function AccountDialog() {
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)
  const isExplicitlySignedOut = useAuthStore((state) => state.isExplicitlySignedOut)
  const isAnonymous = Boolean(user?.is_anonymous)
  const canUpgrade = isAnonymous
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>('upgrade')
  const resolvedMode = mode === 'reset-password' ? 'reset-password' : canUpgrade ? mode : 'sign-in'
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm({
    defaultValues: {
      confirmPassword: '',
      email: '',
      password: '',
    },
    validators: {
      onSubmit: ({ value }) => validateAccountForm(value, resolvedMode),
    },
    onSubmit: async ({ value }) => {
      setError(null)
      setNotice(null)
      setIsSubmitting(true)

      try {
        if (resolvedMode === 'upgrade') {
          await upgradeAnonymousUser({
            email: value.email.trim(),
            emailRedirectTo: getAppUrl('/story-flow/'),
            password: value.password,
          })
          setNotice('Check your email to verify this account before signing in elsewhere.')
          toast.success('Check your email to verify this account.')
          form.reset()
        } else if (resolvedMode === 'reset-password') {
          await requestPasswordReset({
            email: value.email.trim(),
            redirectTo: getAppUrl('/reset-password'),
          })
          setNotice('Check your email for a password reset link.')
          toast.success('Password reset email sent.')
          form.reset()
        } else {
          await signInWithEmailPassword({
            email: value.email.trim(),
            password: value.password,
          })
          toast.success('Signed in.')
          setOpen(false)
          form.reset()
        }
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'The account request failed.')
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  const accountLabel = user?.email
    ? user.email
    : isExplicitlySignedOut
      ? 'Signed out'
      : 'Guest story'

  async function continueAsGuest() {
    setError(null)
    setNotice(null)
    setIsSubmitting(true)

    try {
      await continueAnonymously()
      setOpen(false)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not start a guest session.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function signOut() {
    setError(null)
    setNotice(null)
    setIsSubmitting(true)

    try {
      await signOutOfPermanentAccount()
      setOpen(false)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Sign out failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode)
    setError(null)
    setNotice(null)
    form.reset()
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (!nextOpen) {
      setError(null)
      setNotice(null)
      form.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          aria-label="Account"
          disabled={isLoading}
          size="icon-sm"
          variant="outline"
        >
          <UserRound />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
          <DialogDescription>{accountLabel}</DialogDescription>
        </DialogHeader>

        {user && !isAnonymous ? (
          <div className="grid gap-4">
            <div className="rounded-lg border border-accent/25 bg-accent/10 p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-5 text-accent" />
                <p className="text-sm font-semibold text-foreground">Stories are saved to this account.</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Sign in with this email on another device to continue the same library.
              </p>
            </div>

            {notice && <AccountNotice message={notice} />}
            {error && <AccountError message={error} />}

            <DialogFooter>
              <Button disabled={isSubmitting} onClick={signOut} type="button" variant="outline">
                <LogOut />
                Sign out
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="grid gap-4">
            {canUpgrade && resolvedMode !== 'reset-password' && (
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-1">
                <Button
                  onClick={() => switchMode('upgrade')}
                  size="sm"
                  type="button"
                  variant={mode === 'upgrade' ? 'hero' : 'ghost'}
                >
                  Save stories
                </Button>
                <Button
                  onClick={() => switchMode('sign-in')}
                  size="sm"
                  type="button"
                  variant={mode === 'sign-in' ? 'hero' : 'ghost'}
                >
                  Sign in
                </Button>
              </div>
            )}

            <p className="text-sm leading-relaxed text-muted-foreground">
              {resolvedMode === 'upgrade'
                ? 'Add email and password to this guest account. Your current stories stay attached.'
                : resolvedMode === 'reset-password'
                  ? 'Enter your account email and we will send a link to choose a new password.'
                  : canUpgrade
                    ? 'Sign in to an existing account. This switches libraries and does not merge guest stories in this version.'
                    : 'Sign in to an existing account, or continue anonymously to start a guest library.'}
            </p>

            {notice && <AccountNotice message={notice} />}

            <Form
              onSubmit={(event) => {
                event.preventDefault()
                void form.handleSubmit()
              }}
            >
              <FieldGroup>
                <form.Field
                  name="email"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.errors.length > 0 ||
                      (field.state.meta.isTouched && !field.state.meta.isValid)

                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                        <Input
                          aria-invalid={isInvalid}
                          autoComplete="email"
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="you@example.com"
                          type="email"
                          value={field.state.value}
                          variant="hero"
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    )
                  }}
                />

                {resolvedMode !== 'reset-password' && (
                  <form.Field
                    name="password"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.errors.length > 0 ||
                        (field.state.meta.isTouched && !field.state.meta.isValid)

                      return (
                        <Field data-invalid={isInvalid}>
                          <div className="flex items-center justify-between gap-3">
                            <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                            {resolvedMode === 'sign-in' && (
                              <Button
                                className="h-auto px-0 text-xs"
                                onClick={() => switchMode('reset-password')}
                                type="button"
                                variant="link"
                              >
                                Forgot password?
                              </Button>
                            )}
                          </div>
                          <Input
                            aria-invalid={isInvalid}
                            autoComplete={resolvedMode === 'upgrade' ? 'new-password' : 'current-password'}
                            id={field.name}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={(event) => field.handleChange(event.target.value)}
                            placeholder="Password"
                            type="password"
                            value={field.state.value}
                            variant="hero"
                          />
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      )
                    }}
                  />
                )}

                {resolvedMode === 'upgrade' && (
                  <form.Field
                    name="confirmPassword"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.errors.length > 0 ||
                        (field.state.meta.isTouched && !field.state.meta.isValid)

                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
                          <Input
                            aria-invalid={isInvalid}
                            autoComplete="new-password"
                            id={field.name}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={(event) => field.handleChange(event.target.value)}
                            placeholder="Repeat password"
                            type="password"
                            value={field.state.value}
                            variant="hero"
                          />
                          <FieldDescription>
                            Repeat the password so this guest story is not saved with a typo.
                          </FieldDescription>
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      )
                    }}
                  />
                )}
              </FieldGroup>

              {error && <AccountError message={error} />}

              <Button disabled={isSubmitting} type="submit" variant="hero">
                {resolvedMode === 'upgrade'
                  ? <Mail />
                  : resolvedMode === 'reset-password'
                    ? <KeyRound />
                    : <LogIn />}
                {resolvedMode === 'upgrade'
                  ? 'Save stories'
                  : resolvedMode === 'reset-password'
                    ? 'Send reset link'
                    : 'Sign in'}
              </Button>

              {resolvedMode === 'reset-password' && (
                <Button
                  disabled={isSubmitting}
                  onClick={() => switchMode('sign-in')}
                  type="button"
                  variant="ghost"
                >
                  Back to sign in
                </Button>
              )}
            </Form>

            {!user && resolvedMode !== 'reset-password' && (
              <Button disabled={isSubmitting} onClick={continueAsGuest} type="button" variant="outline">
                Continue anonymously
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function validateAccountForm(
  value: z.infer<typeof accountFormSchema>,
  mode: AuthMode,
) {
  const result = (mode === 'reset-password'
    ? accountFormSchema.pick({ email: true })
    : accountFormSchema
  ).safeParse(value)
  const fields: Partial<Record<keyof z.infer<typeof accountFormSchema>, string>> = {}

  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0]

      if (field === 'email' || field === 'password' || field === 'confirmPassword') {
        fields[field] ??= issue.message
      }
    }
  }

  if (mode === 'upgrade') {
    if (!value.confirmPassword) {
      fields.confirmPassword = 'Repeat the password before saving stories.'
    } else if (value.password !== value.confirmPassword) {
      fields.confirmPassword = 'Passwords do not match.'
    }
  }

  return Object.keys(fields).length ? { fields } : undefined
}

function getAppUrl(path: string) {
  if (typeof window === 'undefined') {
    return path
  }

  return new URL(path, window.location.origin).toString()
}

function AccountNotice({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-accent/25 bg-accent/10 p-3 text-sm leading-relaxed text-foreground">
      <div className="flex items-start gap-2">
        <CircleCheck className="mt-0.5 size-4 shrink-0 text-accent" />
        <p>{message}</p>
      </div>
    </div>
  )
}

function AccountError({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm leading-relaxed text-foreground">
      {message}
    </p>
  )
}
