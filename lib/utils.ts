import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function cleanJsonArtifacts(text: string): string {
  if (!text) return text
  
  return text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .replace(/\{[\s\S]*\}/g, '') // Remove JSON blocks
    .replace(/^\s*["']?verdict["']?\s*:\s*["']?(\w+)["']?/gim, '')
    .replace(/^\s*["']?commentary["']?\s*:\s*["']?/gim, '')
    .replace(/^\s*["']?confidence["']?\s*:\s*\d+/gim, '')
    .replace(/^\s*["']?overallVerdict["']?\s*:\s*["']?(\w+)["']?/gim, '')
    .replace(/^\s*["']?trustScore["']?\s*:\s*\d+/gim, '')
    .replace(/^\s*["']?summary["']?\s*:\s*["']?/gim, '')
    .replace(/^\s*["']?keyIssues["']?\s*:\s*\[/gim, '')
    .replace(/^\s*["']?recommendations["']?\s*:\s*\[/gim, '')
    .replace(/^\s*["']?consensusText["']?\s*:\s*["']?/gim, '')
    .replace(/^\s*["']?betterAnswer["']?\s*:\s*["']?/gim, '')
    .trim()
}
