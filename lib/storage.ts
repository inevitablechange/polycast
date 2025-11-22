import { RecentActivity } from './types'

const STORAGE_KEY = 'polycast_recent_activities'
const MAX_ACTIVITIES = 20

export function saveActivity(activity: RecentActivity): void {
  if (typeof window === 'undefined') return

  const activities = getActivities()
  activities.unshift(activity)
  const trimmed = activities.slice(0, MAX_ACTIVITIES)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
}

export function getActivities(): RecentActivity[] {
  if (typeof window === 'undefined') return []

  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function clearActivities(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
