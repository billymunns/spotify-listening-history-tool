import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function EmptyState({
  title,
  body,
  actionTo,
  actionLabel,
}: {
  title: string
  body: string
  actionTo?: string
  actionLabel?: string
}) {
  return (
    <div className="rounded-3xl border border-line bg-panel px-6 py-12 text-center">
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">{body}</p>
      {actionTo && actionLabel ? (
        <Link
          to={actionTo}
          className="mt-6 inline-flex rounded-full bg-accent px-5 py-2 text-sm font-semibold text-black"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-line bg-panel p-5 sm:p-6 ${className}`}>{children}</section>
}
