import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "#/lib/utils"
import { playSoundEffect } from "#/lib/sound-effects"

const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-md",
    "text-sm font-medium whitespace-nowrap transition-all outline-none",
    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        hero:
          [
            // Warm gradient
            "bg-linear-to-br from-primary via-primary to-chart-3",
            "border border-primary/30 text-primary-foreground",
            // Ember lift
            "shadow-[0_10px_30px_color-mix(in_srgb,var(--primary)_32%,transparent)]",
            "hover:from-primary/95 hover:to-chart-3/90 focus-visible:ring-primary/35",
            "disabled:bg-muted disabled:from-muted disabled:via-muted disabled:to-muted",
            "disabled:text-muted-foreground disabled:shadow-none",
          ],
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
        hero: "h-14 rounded-2xl px-5 has-[>svg]:px-4",
        "hero-icon": "size-14 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  disabled,
  onClick,
  sound,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    sound?: false | "click"
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const resolvedSound = sound ?? (variant === "link" ? false : "click")

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(event)

    const ariaDisabled = event.currentTarget.getAttribute("aria-disabled") === "true"

    if (!event.defaultPrevented && !disabled && !ariaDisabled && resolvedSound === "click") {
      playSoundEffect("buttonClick")
    }
  }

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    />
  )
}

export { Button, buttonVariants }
