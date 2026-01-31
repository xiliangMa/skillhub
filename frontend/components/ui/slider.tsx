import * as React from "react"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: number[]
    defaultValue?: number[]
    onValueChange?: (value: number[]) => void
    max?: number
    min?: number
    step?: number
  }
>(({ className, value, defaultValue, onValueChange, max = 100, min = 0, step = 1, ...props }, ref) => {
  const [internalValue, setInternalValue] = React.useState<number[]>(defaultValue || value || [min])

  const handleChange = (newValue: number[]) => {
    setInternalValue(newValue)
    onValueChange?.(newValue)
  }

  const percentage = ((internalValue[0] - min) / (max - min)) * 100

  return (
    <div
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      {...props}
    >
      <div className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
        <div
          className="absolute h-full bg-primary"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div
        className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        style={{ left: `${percentage}%`, transform: 'translateX(-50%)' }}
      />
    </div>
  )
})
Slider.displayName = "Slider"

export { Slider }