<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { usePosition } from '../composables/usePosition'
import type { BoardRow, TransportMode } from '../lib/config'
import {
  fetchDirections,
  fetchNearbyStops,
  searchStops,
  type DirectionOption,
  type StopOption,
} from '../lib/entur'
import LineBadge from './LineBadge.vue'

const props = defineProps<{ existing: BoardRow[] }>()
const emit = defineEmits<{ add: [rows: BoardRow[]]; cancel: [] }>()

/** How many of the nearest stops to show directions for. */
const NEARBY_STOPS = 10

const MODE_LABELS: Record<TransportMode, string> = {
  bus: 'Buss',
  metro: 'T-bane',
  tram: 'Trikk',
  rail: 'Tog',
  water: 'Ferje',
}

interface StopGroup {
  stop: StopOption
  directions: DirectionOption[]
}

const position = usePosition()
const asking = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const groups = ref<StopGroup[]>([])
const selected = ref(new Map<string, { stop: StopOption; direction: DirectionOption }>())
const modeFilter = ref<TransportMode | null>(null)

const query = ref('')
const results = ref<StopOption[]>([])

const keyOf = (d: { quayId: string; lineId: string }) => `${d.quayId}|${d.lineId}`
const existingKeys = computed(() => new Set(props.existing.map(keyOf)))

onMounted(async () => {
  const choice = await position.detectChoice()
  if (choice === 'allowed') loadNearby()
  else if (choice === 'unknown') asking.value = true
})

async function loadNearby() {
  asking.value = false
  loading.value = true
  error.value = null
  try {
    const coords = await position.getPosition()
    const stops = (await fetchNearbyStops(coords.latitude, coords.longitude)).slice(0, NEARBY_STOPS)
    const directions = await fetchDirections(stops.map((s) => s.id))
    groups.value = stops
      .map((stop) => ({ stop, directions: directions.get(stop.id) ?? [] }))
      .filter((g) => g.directions.length > 0)
    if (groups.value.length === 0) error.value = 'Fant ingen avganger innen 1 km. Søk etter holdeplassen i stedet.'
  } catch {
    error.value = 'Fant ikke posisjonen din. Søk etter holdeplassen i stedet.'
  } finally {
    loading.value = false
  }
}

function skipPosition() {
  position.decline()
  asking.value = false
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

async function addStop(stop: StopOption) {
  query.value = ''
  results.value = []
  const existing = groups.value.find((g) => g.stop.id === stop.id)
  if (existing) {
    groups.value = [existing, ...groups.value.filter((g) => g !== existing)]
    return
  }
  loading.value = true
  error.value = null
  try {
    const directions = (await fetchDirections([stop.id])).get(stop.id) ?? []
    if (directions.length === 0) error.value = `Ingen avganger fra ${stop.name} den neste uka.`
    else groups.value = [{ stop, directions }, ...groups.value]
  } catch {
    error.value = 'Klarte ikke å hente linjer. Prøv igjen.'
  } finally {
    loading.value = false
  }
}

const modes = computed(() => {
  const present = new Set(groups.value.flatMap((g) => g.directions.map((d) => d.transportMode)))
  return (Object.keys(MODE_LABELS) as TransportMode[]).filter((mode) => present.has(mode))
})

const visibleGroups = computed(() =>
  groups.value
    .map((g) => ({
      ...g,
      directions: modeFilter.value ? g.directions.filter((d) => d.transportMode === modeFilter.value) : g.directions,
    }))
    .filter((g) => g.directions.length > 0),
)

function toggle(stop: StopOption, direction: DirectionOption) {
  const key = keyOf(direction)
  const next = new Map(selected.value)
  if (next.has(key)) next.delete(key)
  else next.set(key, { stop, direction })
  selected.value = next
}

function save() {
  const rows: BoardRow[] = [...selected.value.values()].map(({ stop, direction }) => ({
    id: crypto.randomUUID(),
    name: `${direction.publicCode} mot ${direction.destinations[0] ?? stop.name}`,
    transportMode: direction.transportMode,
    lineId: direction.lineId,
    publicCode: direction.publicCode,
    quayId: direction.quayId,
    stopName: stop.name,
  }))
  emit('add', rows)
}

function formatDistance(meters: number): string {
  return meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}
</script>

<template>
  <section class="add">
    <template v-if="asking">
      <h3>Vil du se avganger i nærheten?</h3>
      <p class="hint">Posisjonen brukes bare til å finne holdeplasser, og lagres ikke.</p>
      <div class="actions">
        <button class="primary" @click="loadNearby">Bruk posisjonen min</button>
        <button @click="skipPosition">Søk i stedet</button>
        <button class="link" @click="emit('cancel')">Avbryt</button>
      </div>
    </template>

    <template v-else>
      <h3>Velg avganger</h3>

      <div class="search">
        <input v-model="query" type="search" placeholder="Søk etter holdeplass" />
        <ul v-if="results.length" class="results">
          <li v-for="stop in results" :key="stop.id">
            <button class="result" @click="addStop(stop)">
              <span>{{ stop.name }}</span>
              <span class="meta">{{ stop.description }}</span>
            </button>
          </li>
        </ul>
      </div>

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

      <p v-if="loading" class="hint">Henter avganger...</p>
      <p v-if="error" class="error">{{ error }}</p>

      <div class="groups">
        <section v-for="group in visibleGroups" :key="group.stop.id" class="group">
          <h4>
            {{ group.stop.name }}
            <span v-if="group.stop.distance !== null" class="meta">{{ formatDistance(group.stop.distance) }}</span>
          </h4>
          <ul>
            <li v-for="direction in group.directions" :key="keyOf(direction)">
              <label class="option" :class="{ added: existingKeys.has(keyOf(direction)) }">
                <input
                  type="checkbox"
                  :checked="existingKeys.has(keyOf(direction)) || selected.has(keyOf(direction))"
                  :disabled="existingKeys.has(keyOf(direction))"
                  @change="toggle(group.stop, direction)"
                />
                <LineBadge
                  :mode="direction.transportMode"
                  :public-code="direction.publicCode"
                  :colours="direction.colours"
                />
                <span class="destination">mot {{ direction.destinations.join(', ') }}</span>
                <span class="meta">
                  {{ existingKeys.has(keyOf(direction)) ? 'Lagt til' : direction.quayCode ? `Plattform ${direction.quayCode}` : '' }}
                </span>
              </label>
            </li>
          </ul>
        </section>
      </div>

      <div class="actions sticky">
        <button class="primary" :disabled="selected.size === 0" @click="save">
          {{ selected.size === 1 ? 'Legg til 1 avgang' : `Legg til ${selected.size} avganger` }}
        </button>
        <button class="link" @click="emit('cancel')">Avbryt</button>
      </div>
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

h4 {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 1.25rem 0 0.4rem;
  font-size: 1rem;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.search {
  position: relative;
}

.search input {
  width: 100%;
}

.results {
  position: absolute;
  z-index: 1;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  padding: 0.25rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.4rem;
  max-height: 50vh;
  overflow-y: auto;
}

.result {
  display: flex;
  width: 100%;
  justify-content: space-between;
  gap: 1rem;
  border: none;
  text-align: left;
}

.option {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.6rem;
  margin-bottom: 0.3rem;
  border: 1px solid var(--border);
  border-radius: 0.4rem;
  background: var(--surface);
  cursor: pointer;
}

.option:has(input:checked:not(:disabled)) {
  border-color: var(--accent);
}

.option.added {
  opacity: 0.5;
  cursor: default;
}

.option input {
  width: 1.1rem;
  height: 1.1rem;
  margin: 0;
}

.destination {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  color: var(--dim);
  font-size: 0.85rem;
  font-weight: 400;
  white-space: nowrap;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.75rem;
}

.filters .active {
  border-color: var(--accent);
  color: var(--accent);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.sticky {
  position: sticky;
  bottom: 0;
  padding: 0.75rem 0;
  background: #0b0b0b;
}

.link {
  background: none;
  border: none;
  color: var(--dim);
}

.hint {
  color: var(--dim);
  font-size: 0.9rem;
}

.error {
  color: var(--red);
  font-size: 0.9rem;
}
</style>
