<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { BoardRow, TransportMode } from '../lib/config'
import {
  fetchDirections,
  fetchNearbyStops,
  searchStops,
  type DirectionOption,
  type StopOption,
} from '../lib/entur'
import LineBadge from './LineBadge.vue'

const emit = defineEmits<{ add: [row: BoardRow]; cancel: [] }>()

const POSITION_TIMEOUT = 10_000

const MODE_LABELS: Record<TransportMode, string> = {
  bus: 'Buss',
  metro: 'T-bane',
  tram: 'Trikk',
  rail: 'Tog',
  water: 'Ferje',
}

type Step = 'ask' | 'stops' | 'directions' | 'name'

const step = ref<Step>('ask')
const loading = ref(false)
const error = ref<string | null>(null)

// Step: stops
const nearby = ref<StopOption[]>([])
const query = ref('')
const results = ref<StopOption[]>([])
const stop = ref<StopOption | null>(null)

// Step: directions
const directions = ref<DirectionOption[]>([])
const modeFilter = ref<TransportMode | null>(null)
const direction = ref<DirectionOption | null>(null)

// Step: name
const name = ref('')

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: POSITION_TIMEOUT, maximumAge: 60_000 }),
  )
}

async function useLocation() {
  loading.value = true
  error.value = null
  try {
    const { coords } = await getPosition()
    nearby.value = await fetchNearbyStops(coords.latitude, coords.longitude)
    if (nearby.value.length === 0) error.value = 'Fant ingen holdeplasser innen 1 km. Søk i stedet.'
  } catch {
    error.value = 'Fant ikke posisjonen din. Søk etter holdeplassen i stedet.'
  } finally {
    loading.value = false
    step.value = 'stops'
  }
}

function useSearch() {
  error.value = null
  step.value = 'stops'
}

let searchTimer: ReturnType<typeof setTimeout> | undefined
let searchController: AbortController | null = null

watch(query, (text) => {
  clearTimeout(searchTimer)
  searchController?.abort()
  if (text.trim().length < 2) {
    results.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    searchController = new AbortController()
    try {
      results.value = await searchStops(text.trim(), searchController.signal)
    } catch (e) {
      if ((e as Error).name !== 'AbortError') error.value = 'Søket feilet. Prøv igjen.'
    }
  }, 250)
})

const stopList = computed(() => (query.value.trim().length >= 2 ? results.value : nearby.value))

async function selectStop(option: StopOption) {
  stop.value = option
  step.value = 'directions'
  loading.value = true
  error.value = null
  directions.value = []
  modeFilter.value = null
  try {
    directions.value = await fetchDirections(option.id)
    if (directions.value.length === 0) error.value = 'Ingen avganger fra denne holdeplassen den neste uka.'
  } catch {
    error.value = 'Klarte ikke å hente linjer. Prøv igjen.'
  } finally {
    loading.value = false
  }
}

const modes = computed(() => {
  const present = new Set(directions.value.map((d) => d.transportMode))
  return (Object.keys(MODE_LABELS) as TransportMode[]).filter((mode) => present.has(mode))
})

const filteredDirections = computed(() =>
  modeFilter.value ? directions.value.filter((d) => d.transportMode === modeFilter.value) : directions.value,
)

function selectDirection(option: DirectionOption) {
  direction.value = option
  name.value = `${option.publicCode} mot ${option.destinations[0] ?? stop.value?.name}`
  step.value = 'name'
}

function save() {
  if (!stop.value || !direction.value || !name.value.trim()) return
  emit('add', {
    id: crypto.randomUUID(),
    name: name.value.trim(),
    transportMode: direction.value.transportMode,
    lineId: direction.value.lineId,
    publicCode: direction.value.publicCode,
    quayId: direction.value.quayId,
    stopName: stop.value.name,
  })
}

function formatDistance(meters: number): string {
  return meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}
</script>

<template>
  <section class="add">
    <template v-if="step === 'ask'">
      <h3>Vil du se holdeplasser i nærheten?</h3>
      <p class="hint">Posisjonen brukes bare til å finne holdeplasser, og lagres ikke.</p>
      <div class="actions">
        <button class="primary" :disabled="loading" @click="useLocation">
          {{ loading ? 'Finner posisjon...' : 'Bruk posisjonen min' }}
        </button>
        <button :disabled="loading" @click="useSearch">Søk i stedet</button>
        <button class="link" @click="emit('cancel')">Avbryt</button>
      </div>
    </template>

    <template v-else-if="step === 'stops'">
      <h3>Velg holdeplass</h3>
      <input v-model="query" type="search" placeholder="Søk etter holdeplass" autofocus />
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="nearby.length && !query" class="label">I nærheten</p>
      <ul class="options">
        <li v-for="option in stopList" :key="option.id">
          <button class="option" @click="selectStop(option)">
            <span>{{ option.name }}</span>
            <span class="meta">
              {{ option.distance !== null ? formatDistance(option.distance) : option.description }}
            </span>
          </button>
        </li>
      </ul>
      <div class="actions">
        <button class="link" @click="emit('cancel')">Avbryt</button>
      </div>
    </template>

    <template v-else-if="step === 'directions'">
      <h3>Velg linje og retning fra {{ stop?.name }}</h3>
      <div v-if="modes.length > 1" class="filters">
        <button :class="{ active: modeFilter === null }" @click="modeFilter = null">Alle</button>
        <button
          v-for="mode in modes"
          :key="mode"
          :class="{ active: modeFilter === mode }"
          @click="modeFilter = mode"
        >
          {{ MODE_LABELS[mode] }}
        </button>
      </div>
      <p v-if="loading" class="hint">Henter linjer...</p>
      <p v-if="error" class="error">{{ error }}</p>
      <ul class="options">
        <li v-for="option in filteredDirections" :key="`${option.quayId}|${option.lineId}`">
          <button class="option" @click="selectDirection(option)">
            <span class="direction">
              <LineBadge :mode="option.transportMode" :public-code="option.publicCode" :colours="option.colours" />
              mot {{ option.destinations.join(', ') }}
            </span>
            <span v-if="option.quayCode" class="meta">Plattform {{ option.quayCode }}</span>
          </button>
        </li>
      </ul>
      <div class="actions">
        <button @click="step = 'stops'">Tilbake</button>
        <button class="link" @click="emit('cancel')">Avbryt</button>
      </div>
    </template>

    <template v-else-if="step === 'name'">
      <h3>Navn på avgangen</h3>
      <form @submit.prevent="save">
        <input v-model="name" type="text" required autofocus />
        <div class="actions">
          <button type="submit" class="primary" :disabled="!name.trim()">Lagre</button>
          <button type="button" @click="step = 'directions'">Tilbake</button>
          <button type="button" class="link" @click="emit('cancel')">Avbryt</button>
        </div>
      </form>
    </template>
  </section>
</template>

<style scoped>
.add {
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 0.6rem;
  background: #0b0b0b;
}

h3 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
}

input {
  width: 100%;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.link {
  background: none;
  border: none;
  color: var(--dim);
}

.hint,
.label {
  color: var(--dim);
  font-size: 0.9rem;
}

.label {
  margin: 1rem 0 0.25rem;
}

.error {
  color: var(--red);
  font-size: 0.9rem;
}

.options {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
  max-height: 50vh;
  overflow-y: auto;
}

.option {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.35rem;
  text-align: left;
}

.direction {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.meta {
  color: var(--dim);
  font-size: 0.85rem;
  white-space: nowrap;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.filters .active {
  border-color: var(--accent);
  color: var(--accent);
}
</style>
