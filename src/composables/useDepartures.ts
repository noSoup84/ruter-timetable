import { onScopeDispose, ref, watch, type Ref } from 'vue'
import type { BoardRow } from '../lib/config'
import { fetchDepartures, type RowResult } from '../lib/entur'

const POLL_INTERVAL = 30_000

/**
 * Fetches departures for the rows every 30 seconds. On failure the last
 * results are kept, so the board can keep counting down.
 */
export function useDepartures(rows: Ref<BoardRow[]>) {
  const results = ref(new Map<string, RowResult>())
  const lastSuccess = ref<number | null>(null)
  let controller: AbortController | null = null

  async function refresh() {
    controller?.abort()
    controller = new AbortController()
    try {
      results.value = await fetchDepartures(rows.value, controller.signal)
      lastSuccess.value = Date.now()
    } catch (error) {
      if ((error as Error).name !== 'AbortError') console.warn('Henting av avganger feilet', error)
    }
  }

  const timer = setInterval(refresh, POLL_INTERVAL)
  watch(rows, refresh, { deep: true, immediate: true })

  onScopeDispose(() => {
    clearInterval(timer)
    controller?.abort()
  })

  return { results, lastSuccess }
}
