import { cn } from '@/lib/utils'

type LogoProps = {
  className?: string
}

export function LogoMark({ className }: LogoProps) {
  return (
    <span
      className={cn(
        'flex size-12 shrink-0 items-center justify-center overflow-hidden',
        className,
      )}
    >
      <img src="/logo-black.svg" alt="" className="size-full object-contain" />
    </span>
  )
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <div className="flex flex-col leading-none">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Stock Research Copilot
        </span>
        <span className="text-xs text-muted-foreground">SEC filing assistant</span>
      </div>
    </div>
  )
}