import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#/lib/utils"

const inputVariants = cva(
  [
    "w-full min-w-0 border text-base outline-none md:text-sm",
    "transition-[color,box-shadow]",
    "selection:bg-primary selection:text-primary-foreground",
    "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
    "placeholder:text-muted-foreground",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        default:
          "border-input bg-transparent shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30",
        hero:
          [
            // Dark story field
            "border-primary/30 bg-background/75 text-foreground",
            // Inner depth
            "shadow-inner",
            "focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/25",
          ],
      },
      size: {
        default: "h-9 rounded-md px-3 py-1",
        hero: "h-14 rounded-2xl px-4 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Input({
  className,
  type,
  variant,
  size,
  ...props
}: Omit<React.ComponentProps<"input">, "size"> &
  VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        inputVariants({ variant, size }),
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input, inputVariants }
