import { onScopeDispose } from 'vue'
import { nextReloadTime } from '../lib/reload'
import { useConfig } from './useConfig'

/** Reloads the page once a day at the configured time. */
export function useAutoReload() {
  const config = useConfig()
  const loadedAt = Date.now()

  // Checks often instead of one long timeout, since timers stop while the tablet sleeps.
  const timer = setInterval(() => {
    const { enabled, time } = config.value.autoReload
    if (enabled && Date.now() >= nextReloadTime(loadedAt, time)) location.reload()
  }, 30_000)

  onScopeDispose(() => clearInterval(timer))
}
