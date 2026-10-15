import { LOGO } from '@/lib/logo'

// Brand mark on a white rounded tile. The chair is drawn at about two-thirds of the tile so it has room to breathe.
// The app UI is light-only, so it uses the light-surface colours (lime + ink); the favicon follows the colour scheme (see lib/logo.ts).
export default function Logo({ size = 48 }: { size?: number }) {
  const inner = Math.round(size * 0.66)
  return (
    <span aria-hidden="true" className="inline-grid place-items-center border border-line bg-white shadow-[0_1px_2px_rgb(23_23_23/0.05),0_8px_20px_-12px_rgb(23_23_23/0.2)]"
      style={{ width: size, height: size, borderRadius: size * 0.3 }}>
      <svg viewBox={LOGO.viewBox} width={inner} height={inner}>
        <path fill={LOGO.lime} d={LOGO.limePath} />
        <path fill={LOGO.ink} d={LOGO.blockPath} />
      </svg>
    </span>
  )
}
