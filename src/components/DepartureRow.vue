<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { BoardRow } from '../lib/config'
import { firstSituation, notices, upcoming } from '../lib/departures'
import type { RowResult } from '../lib/entur'
import { formatClock, formatDeparture, isDelayed } from '../lib/format'
import LineBadge from './LineBadge.vue'

const props = defineProps<{
  row: BoardRow
  result: RowResult | undefined
  now: number
  minutesLimit: number
  noticeOpen: boolean
}>()

const emit = defineEmits<{ toggleNotice: [] }>()

const departures = computed(() => (props.result?.found ? upcoming(props.result.departures, props.now) : []))
const situation = computed(() => (props.result?.found ? firstSituation(props.result.departures) : null))
const rowNotices = computed(() => (props.result?.found ? notices(props.result.departures) : []))
const colours = computed(() => (props.result?.found ? props.result.colours : null))

/** How long a tap on the times shows them as clock time. */
const CLOCK_TIMEOUT = 5_000

// Rows in the lower half of the screen open the bubble upwards, so it stays on screen.
const rowElement = ref<HTMLElement | null>(null)
const bubbleAbove = ref(false)

watch(
  () => props.noticeOpen,
  (open) => {
    const rect = rowElement.value?.getBoundingClientRect()
    if (open && rect) bubbleAbove.value = rect.top + rect.height / 2 > window.innerHeight / 2
  },
)

const showClock = ref(false)
let clockTimer: ReturnType<typeof setTimeout> | undefined

function toggleClock() {
  clearTimeout(clockTimer)
  showClock.value = !showClock.value
  if (showClock.value) clockTimer = setTimeout(() => (showClock.value = false), CLOCK_TIMEOUT)
}

onBeforeUnmount(() => clearTimeout(clockTimer))
</script>

<template>
  <li ref="rowElement" class="row">
    <button
      v-if="rowNotices.length"
      class="badge-button"
      :aria-expanded="noticeOpen"
      aria-label="Vis informasjon"
      @click.stop="emit('toggleNotice')"
    >
      <LineBadge class="badge" :mode="row.transportMode" :public-code="row.publicCode" :colours="colours" />
      <svg class="info" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="12" fill="#f5c400" />
        <circle cx="12" cy="6.8" r="1.9" fill="#000" />
        <rect x="10.3" y="10.2" width="3.4" height="8.6" rx="1.2" fill="#000" />
      </svg>
    </button>
    <LineBadge v-else class="badge" :mode="row.transportMode" :public-code="row.publicCode" :colours="colours" />
    <div v-if="noticeOpen && rowNotices.length" class="bubble" :class="{ above: bubbleAbove }" @click.stop>
      <div v-for="notice in rowNotices" :key="notice.summary" class="notice">
        <p class="notice-summary">{{ notice.summary }}</p>
        <p v-if="notice.description" class="notice-description">{{ notice.description }}</p>
      </div>
    </div>
    <div class="name">
      <div class="title">{{ row.name }}</div>
      <div v-if="situation" class="situation">
        <span class="warning" aria-hidden="true">!</span>{{ situation }}
      </div>
    </div>
    <div class="times" @click.stop="departures.length && toggleClock()">
      <template v-if="result && !result.found">
        <span class="dim">Finner ikke linjen</span>
        <RouterLink to="/config" class="fix">Endre</RouterLink>
      </template>
      <span v-else-if="result && departures.length === 0" class="dim">Ingen avganger</span>
      <span
        v-for="departure in departures"
        v-else
        :key="departure.aimed"
        class="time"
        :class="{ scheduled: !departure.realtime }"
      >
        <span v-if="departure.cancelled" class="cancelled">Innstilt</span>
        <template v-else>
          <s v-if="isDelayed(departure.aimed, departure.expected)" class="aimed">{{ formatClock(departure.aimed) }}</s>
          {{ showClock ? formatClock(departure.expected) : formatDeparture(departure.expected, now, minutesLimit) }}
        </template>
      </span>
    </div>
  </li>
</template>

<style scoped>
.row {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0 0.6em;
  padding: 0.45em 0;
  border-bottom: 1px solid var(--border);
}

.badge {
  font-size: 1.1em;
}

.title {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge-button {
  position: relative;
  padding: 0;
  border: none;
  background: none;
  font-size: inherit;
}

/* Small yellow circle with a black "i" in the top left corner of the badge. */
.info {
  position: absolute;
  top: -0.28em;
  left: -0.28em;
  width: 0.65em;
  height: 0.65em;
  border-radius: 50%;
  box-shadow: 0 0 0 0.06em var(--bg);
}

.bubble {
  position: absolute;
  z-index: 2;
  top: calc(100% - 0.2em);
  left: 0;
  width: min(36em, 85vw);
  padding: 0.7em 0.9em;
  border: 1px solid #fff;
  border-radius: 0.5em;
  background: var(--surface);
  box-shadow: 0 0.5em 2em rgb(0 0 0 / 0.7);
  font-size: 0.5em;
  font-weight: 400;
}

/* The tail of the speech bubble, pointing up at the badge. */
.bubble::before {
  content: '';
  position: absolute;
  top: -0.5em;
  left: 2em;
  width: 1em;
  height: 1em;
  background: var(--surface);
  border-left: 1px solid #fff;
  border-top: 1px solid #fff;
  transform: rotate(45deg);
}

.bubble.above {
  top: auto;
  bottom: calc(100% - 0.2em);
}

.bubble.above::before {
  top: auto;
  bottom: -0.5em;
  transform: rotate(225deg);
}

.notice + .notice {
  margin-top: 0.8em;
  padding-top: 0.8em;
  border-top: 1px solid var(--border);
}

.notice p {
  margin: 0;
}

.notice-summary {
  font-weight: 600;
}

.notice-description {
  margin-top: 0.3em !important;
  color: var(--dim);
  white-space: pre-line;
}

.situation {
  font-size: 0.55em;
  color: var(--dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.warning {
  display: inline-block;
  width: 1.3em;
  height: 1.3em;
  margin-right: 0.4em;
  border-radius: 50%;
  background: #f5c400;
  color: #000;
  font-weight: 700;
  text-align: center;
  line-height: 1.3em;
}

.times {
  display: flex;
  gap: 0.6em;
  cursor: pointer;
  justify-content: flex-end;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.time {
  min-width: 3.2em;
  text-align: right;
  font-weight: 600;
}

.time.scheduled {
  color: var(--dim);
  font-weight: 400;
}

.aimed {
  font-size: 0.6em;
  color: var(--dim);
  font-weight: 400;
}

.cancelled {
  color: var(--red);
}

.dim {
  color: var(--dim);
}

.fix {
  font-size: 0.6em;
  align-self: center;
}

@media (orientation: portrait) {
  .times {
    grid-column: 2 / -1;
    justify-content: flex-start;
  }

  .time {
    text-align: left;
  }
}
</style>
