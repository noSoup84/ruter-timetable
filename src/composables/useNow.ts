import { onScopeDispose, ref } from 'vue'

/** The current time in milliseconds, updated every second. */
export function useNow(interval = 1000) {
  const now = ref(Date.now())
  const timer = setInterval(() => (now.value = Date.now()), interval)
  onScopeDispose(() => clearInterval(timer))
  return now
}
