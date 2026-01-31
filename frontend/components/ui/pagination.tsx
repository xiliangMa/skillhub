import * as React from "react"

import { cn } from "@/lib/utils"

const Pagination = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-center", className)}
    {...props}
  />
))
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & React.AnchorHTMLAttributes<HTMLAnchorElement>

const PaginationLink = React.forwardRef<
  HTMLAnchorElement,
  PaginationLinkProps
>(({ className, isActive, ...props }, ref) => (
  <a
    ref={ref}
    aria-current={isActive ? "page" : undefined}
    className={cn(
      "flex h-9 w-9 items-center justify-center rounded-md border border-input bg-transparent text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
      isActive && "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
      className
    )}
    {...props}
  />
))
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className, ...props }, ref) => (
  <PaginationLink
    ref={ref}
    aria-label="Go to previous page"
    className={cn("h-9 w-9", className)}
    {...props}
  />
))
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className, ...props }, ref) => (
  <PaginationLink
    ref={ref}
    aria-label="Go to next page"
    className={cn("h-9 w-9", className)}
    {...props}
  />
))
PaginationNext.displayName = "PaginationNext"

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}