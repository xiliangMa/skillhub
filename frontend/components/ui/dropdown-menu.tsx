"use client"

import * as React from "react"
import { ChevronDown, Check } from "lucide-react"

import { cn } from "@/lib/utils"

interface DropdownMenuContextValue {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | undefined>(undefined)

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext)
  if (!context) {
    throw new Error("useDropdownMenu must be used within a DropdownMenuProvider")
  }
  return context
}

interface DropdownMenuProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DropdownMenu({ children, open: controlledOpen, onOpenChange }: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = React.useCallback(
    (value: React.SetStateAction<boolean>) => {
      const newValue = typeof value === "function" ? value(open) : value
      if (controlledOpen === undefined) {
        setInternalOpen(newValue)
      }
      onOpenChange?.(newValue)
    },
    [open, controlledOpen, onOpenChange]
  )

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      {children}
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuTrigger({ children, asChild = false, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { open, setOpen } = useDropdownMenu()

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        setOpen(!open)
        ;(children as any).props.onClick?.(e)
      },
    })
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
    </button>
  )
}

export function DropdownMenuContent({ children, className, align = "start" }: { children: React.ReactNode; className?: string; align?: "start" | "center" | "end" }) {
  const { open, setOpen } = useDropdownMenu()
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, setOpen])

  if (!open) return null

  const alignClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-gray-950 shadow-md animate-in fade-in-0 zoom-in-95",
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({ children, className, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDropdownMenu()

  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e)
        setOpen(false)
      }}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 hover:text-gray-900",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function DropdownMenuLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-2 py-1.5 text-sm font-semibold", className)}>
      {children}
    </div>
  )
}

export function DropdownMenuSeparator() {
  return <div className="-mx-1 my-1 h-px bg-gray-200" />
}
