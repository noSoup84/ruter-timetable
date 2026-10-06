import { ref } from 'vue'

const POSITION_TIMEOUT = 10_000

export type PositionChoice = 'unknown' | 'allowed' | 'declined'

// Shared for the whole visit, so the user is asked at most once.
const choice = ref<PositionChoice>('unknown')
let cached: Promise<GeolocationCoordinates> | null = null

function requestPosition(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition((p) => resolve(p.coords), reject, {
      timeout: POSITION_TIMEOUT,
      maximumAge: 5 * 60_000,
    }),
  )
}

/**
 * Asks for the position at most once per visit. If the browser already has
 * permission, the in-app question is skipped.
 */
export function usePosition() {
  async function detectChoice(): Promise<PositionChoice> {
    if (choice.value !== 'unknown' || !navigator.permissions) return choice.value
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' })
      if (status.state === 'granted') choice.value = 'allowed'
      if (status.state === 'denied') choice.value = 'declined'
    } catch {
      // Permissions API not available for geolocation. Ask in the app instead.
    }
    return choice.value
  }

  function getPosition(): Promise<GeolocationCoordinates> {
    choice.value = 'allowed'
    cached ??= requestPosition().catch((error) => {
      cached = null
      throw error
    })
    return cached
  }

  function decline() {
    choice.value = 'declined'
  }

  return { choice, detectChoice, getPosition, decline }
}
