import * as React from "react"

import { Label } from "#/components/ui/label"
import { cn } from "#/lib/utils"

function Form({ className, ...props }: React.ComponentProps<"form">) {
  return <form className={cn("grid gap-3", className)} {...props} />
}

function Field({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid gap-2", className)} {...props} />
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid gap-3", className)} {...props} />
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return <Label className={cn("text-sm font-medium", className)} {...props} />
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-sm leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  )
}

function FieldError({
  className,
  errors,
  ...props
}: React.ComponentProps<"p"> & {
  errors?: unknown[]
}) {
  const message = errors?.map(formatError).find(Boolean) ?? props.children

  if (!message) {
    return null
  }

  return (
    <p className={cn("text-sm text-destructive", className)} {...props}>
      {message}
    </p>
  )
}

function formatError(error: unknown) {
  if (!error) {
    return null
  }

  if (typeof error === "string") {
    return error
  }

  if (typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message
    return typeof message === "string" ? message : null
  }

  return null
}

export {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Form,
}
