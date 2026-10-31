import { TOOLS, type Tool } from '../riff-engine'

// What you have ticked. Pure: the store that keeps it is in use-my-bar.ts.
// `items` holds Bar Item IDs, and names from Custom Drinks that no Bar Item
// covers.
export interface MyBar {
  tools: Tool[]
  items: string[]
}

export const EMPTY_MY_BAR: MyBar = { tools: [], items: [] }

export const isMyBarEmpty = (myBar: MyBar) => myBar.tools.length === 0 && myBar.items.length === 0

// My Bar from anything, checked field by field: anything unreadable is left out.
export function checkMyBar(value: unknown): MyBar {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return EMPTY_MY_BAR
  const { tools, items } = value as Record<string, unknown>
  return {
    tools: Array.isArray(tools) ? TOOLS.filter((tool) => tools.includes(tool)) : [],
    items: Array.isArray(items) ? items.filter((item): item is string => typeof item === 'string') : [],
  }
}

// My Bar as stored.
export function readMyBar(saved: string | null): MyBar {
  try {
    return checkMyBar(saved === null ? null : JSON.parse(saved))
  } catch {
    return EMPTY_MY_BAR
  }
}
