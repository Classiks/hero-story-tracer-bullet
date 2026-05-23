import { Button } from '#/components/ui/button'
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
  StoryCopy,
  StoryFrame,
  StoryHeading,
  StorySurface,
} from '#/components/story-flow/story-primitives'
import { updatePassword } from '#/lib/supabase-auth'
import { useAuthStore } from '#/state/auth'
import { createFileRoute } from '@tanstack/react-router'
import { KeyRound, Loader2 } from 'lucide-react'
import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { toast } from 'sonner'
import * as z from 'zod'
import { Route as StoryFlowRoute } from '#/routes/story-flow/index'

const resetPasswordSchema = z.object({
  confirmPassword: z.string(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
})

export const Route = createFileRoute('/reset-password')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)
  const isPasswordRecovery = useAuthStore((state) => state.isPasswordRecovery)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm({
    defaultValues: {
      confirmPassword: '',
      password: '',
    },
    validators: {
      onSubmit: ({ value }) => validateResetPasswordForm(value),
    },
    onSubmit: async ({ value }) => {
      setError(null)
      setIsSubmitting(true)

      try {
        await updatePassword({ password: value.password })
        toast.success('Password updated. You can use it next time you sign in.')
        form.reset()
        void navigate({ replace: true, to: StoryFlowRoute.to })
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Password update failed.')
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  const hasRecoverySession = Boolean(isPasswordRecovery && user && !user.is_anonymous)

  return (
    <StoryFrame>
      <main className="min-h-svh px-5 py-6">
        <StoryHeading compact size="page">
          Reset password.
        </StoryHeading>
        <StoryCopy className="max-w-none text-foreground/80">
          Choose a new password for your account.
        </StoryCopy>

        <StorySurface className="mt-8 p-5">
          {isLoading ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Checking your reset link.
            </div>
          ) : hasRecoverySession ? (
            <Form
              onSubmit={(event) => {
                event.preventDefault()
                void form.handleSubmit()
              }}
            >
              <FieldGroup>
                <form.Field
                  name="password"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.errors.length > 0 ||
                      (field.state.meta.isTouched && !field.state.meta.isValid)

                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>New password</FieldLabel>
                        <Input
                          aria-invalid={isInvalid}
                          autoComplete="new-password"
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="New password"
                          type="password"
                          value={field.state.value}
                          variant="hero"
                        />
                        <FieldDescription>
                          Use at least 6 characters.
                        </FieldDescription>
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    )
                  }}
                />

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
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    )
                  }}
                />
              </FieldGroup>

              {error && <ResetPasswordError message={error} />}

              <Button disabled={isSubmitting} type="submit" variant="hero">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <KeyRound />}
                Update password
              </Button>
            </Form>
          ) : (
            <div>
              <ResetPasswordError message="This password reset link is missing or expired." />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Request a new link from the account sign-in dialog, then open the newest email.
              </p>
              <Button
                className="mt-5 w-full"
                onClick={() => void navigate({ to: StoryFlowRoute.to })}
                type="button"
                variant="hero"
              >
                Back to sign in
              </Button>
            </div>
          )}
        </StorySurface>
      </main>
    </StoryFrame>
  )
}

function validateResetPasswordForm(value: z.infer<typeof resetPasswordSchema>) {
  const result = resetPasswordSchema.safeParse(value)
  const fields: Partial<Record<keyof z.infer<typeof resetPasswordSchema>, string>> = {}

  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0]

      if (field === 'password' || field === 'confirmPassword') {
        fields[field] ??= issue.message
      }
    }
  }

  if (!value.confirmPassword) {
    fields.confirmPassword = 'Repeat the password before saving it.'
  } else if (value.password !== value.confirmPassword) {
    fields.confirmPassword = 'Passwords do not match.'
  }

  return Object.keys(fields).length ? { fields } : undefined
}

function ResetPasswordError({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm leading-relaxed text-foreground">
      {message}
    </p>
  )
}
