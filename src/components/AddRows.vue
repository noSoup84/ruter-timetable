<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useConfig } from '../composables/useConfig'
import { useI18n } from '../composables/useI18n'
import { usePosition } from '../composables/usePosition'
import { MAX_ROWS, type BoardRow, type TransportMode } from '../lib/config'
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

/** Transport modes in the order the filter buttons show them. */
const MODES: TransportMode[] = ['bus', 'metro', 'tram', 'rail', 'water']

interface StopGroup {
  stop: StopOption
  directions: DirectionOption[]
}

const config = useConfig()
const { t } = useI18n()
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
const roomLeft = computed(() => MAX_ROWS - props.existing.length)

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
    const distance = config.value.nearbyDistance
    const stops = (await fetchNearbyStops(coords.latitude, coords.longitude, distance)).slice(0, NEARBY_STOPS)
    const directions = await fetchDirections(stops.map((s) => s.id))
    groups.value = stops
      .map((stop) => ({ stop, directions: directions.get(stop.id) ?? [] }))
      .filter((g) => g.directions.length > 0)
    if (groups.value.length === 0) error.value = t('add.noneNearby', { distance })
  } catch {
    error.value = t('add.noPosition')
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
      if ((e as Error).name !== 'AbortError') error.value = t('add.searchFailed')
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
    if (directions.length === 0) error.value = t('add.noneFromStop', { stop: stop.name })
    else groups.value = [{ stop, directions }, ...groups.value]
  } catch {
    error.value = t('add.linesFailed')
  } finally {
    loading.value = false
  }
}

const modes = computed(() => {
  const present = new Set(groups.value.flatMap((g) => g.directions.map((d) => d.transportMode)))
  return MODES.filter((mode) => present.has(mode))
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
  else if (next.size < roomLeft.value) next.set(key, { stop, direction })
  else return
  selected.value = next
}

function save() {
  const rows: BoardRow[] = [...selected.value.values()].map(({ stop, direction }) => ({
    id: crypto.randomUUID(),
    name: t('row.defaultName', { line: direction.publicCode, destination: direction.destinations[0] ?? stop.name }),
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
      <h3>{{ t('add.askPosition') }}</h3>
      <p class="hint">{{ t('add.positionHint') }}</p>
      <div class="actions">
        <button class="primary" @click="loadNearby">{{ t('add.usePosition') }}</button>
        <button @click="skipPosition">{{ t('add.searchInstead') }}</button>
        <button class="link" @click="emit('cancel')">{{ t('add.cancel') }}</button>
      </div>
    </template>

    <template v-else>
      <h3>{{ t('add.title') }}</h3>

      <div class="search">
        <input v-model="query" type="search" :placeholder="t('add.searchPlaceholder')" />
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
        <button :class="{ active: modeFilter === null }" @click="modeFilter = null">{{ t('add.all') }}</button>
        <button
          v-for="mode in modes"
          :key="mode"
          :class="{ active: modeFilter === mode }"
          @click="modeFilter = mode"
        >
          {{ t(`mode.${mode}`) }}
        </button>
      </div>

      <p v-if="loading" class="hint">{{ t('add.loading') }}</p>
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
                  :disabled="existingKeys.has(keyOf(direction)) || (!selected.has(keyOf(direction)) && selected.size >= roomLeft)"
                  @change="toggle(group.stop, direction)"
                />
                <LineBadge
                  :mode="direction.transportMode"
                  :public-code="direction.publicCode"
                  :colours="direction.colours"
                />
                <span class="destination">{{ t('add.to', { destinations: direction.destinations.join(', ') }) }}</span>
                <span class="meta">
                  {{ existingKeys.has(keyOf(direction)) ? t('add.added') : direction.quayCode ? t('add.platform', { code: direction.quayCode }) : '' }}
                </span>
              </label>
            </li>
          </ul>
        </section>
      </div>

      <div class="actions sticky">
        <button class="primary" :disabled="selected.size === 0" @click="save">
          {{ selected.size === 1 ? t('add.addOne') : t('add.addMany', { count: selected.size }) }}
        </button>
        <button class="link" @click="emit('cancel')">{{ t('add.cancel') }}</button>
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

.search input {
  width: 100%;
}

/* In the page flow, not a dropdown, so the virtual keyboard cannot cover it. */
.results {
  margin-top: 0.25rem;
  padding: 0.25rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.4rem;
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
  gap: 0.75rem;
  min-height: 3.25rem;
  padding: 0.5rem 0.8rem;
  margin-bottom: 0.4rem;
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
  gap: 0.5rem;
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
  bottom: env(safe-area-inset-bottom);
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
