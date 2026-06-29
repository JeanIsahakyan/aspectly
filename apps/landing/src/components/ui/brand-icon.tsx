import {
  siReact, siDotnet, siApple, siAndroid, siFlutter, siPython,
  siNpm, siNuget, siApachemaven, siCocoapods, siDart, siPypi, siSwift,
} from 'simple-icons'
import { Globe } from 'lucide-react'

type SI = { path: string; hex: string; title: string }

// Map platform / registry labels -> brand icon (case-insensitive).
const ICONS: Record<string, SI> = {
  'react native': siReact,
  'react native web': siReact,
  '.net': siDotnet,
  dotnet: siDotnet,
  ios: siApple,
  macos: siApple,
  visionos: siApple,
  'ios / macos': siApple,
  'ios / macos / visionos': siApple,
  apple: siApple,
  android: siAndroid,
  flutter: siFlutter,
  python: siPython,
  linux: siPython,
  webkitgtk: siPython,
  'linux (python)': siPython,
  'python / linux': siPython,
  // registries
  npm: siNpm,
  nuget: siNuget,
  'maven central': siApachemaven,
  maven: siApachemaven,
  cocoapods: siCocoapods,
  'pub.dev': siDart,
  dart: siDart,
  pypi: siPypi,
  swiftpm: siSwift,
  swift: siSwift,
}

// These brand marks ARE wordmarks (e.g. the ".NET" logo is the text ".NET"),
// so rendering them next to a matching text label looks redundant — skip them.
const SUPPRESS = new Set(['.net', 'dotnet', 'nuget'])

interface BrandIconProps {
  name: string
  className?: string
  brand?: boolean // use the official brand color instead of currentColor
}

export function BrandIcon({ name, className = 'h-3.5 w-3.5', brand = false }: BrandIconProps) {
  const key = name.toLowerCase().trim()
  if (SUPPRESS.has(key)) return null
  const icon = ICONS[key]
  if (!icon) {
    // Web / unknown -> globe
    return <Globe className={className} aria-hidden="true" />
  }
  return (
    <svg role="img" viewBox="0 0 24 24" className={className} fill={brand ? `#${icon.hex}` : 'currentColor'} aria-hidden="true">
      <title>{icon.title}</title>
      <path d={icon.path} />
    </svg>
  )
}
