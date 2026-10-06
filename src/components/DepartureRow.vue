<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { BoardRow } from '../lib/config'
import { firstSituation, notices, upcoming } from '../lib/departures'
import type { RowResult } from '../lib/entur'
import { formatClock, formatDeparture, isDelayed, type ClockFormat } from '../lib/format'
import { useI18n } from '../composables/useI18n'
import LineBadge from './LineBadge.vue'

const props = defineProps<{
  row: BoardRow
  result: RowResult | undefined
  now: number
  minutesLimit: number
  clockFormat: ClockFormat
  noticeOpen: boolean
}>()

const emit = defineEmits<{ toggleNotice: [] }>()
const { t, text } = useI18n()

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
    <div class="line">
      <span class="stop">{{ row.stopName }}</span>
      <button
        v-if="rowNotices.length"
        class="badge-button"
        :aria-expanded="noticeOpen"
        :aria-label="t('row.showInfo')"
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
    </div>
    <div v-if="noticeOpen && rowNotices.length" class="bubble" :class="{ above: bubbleAbove }" @click.stop>
      <div v-for="notice in rowNotices" :key="JSON.stringify(notice.summary)" class="notice">
        <p class="notice-summary">{{ text(notice.summary) }}</p>
        <p v-if="notice.description" class="notice-description">{{ text(notice.description) }}</p>
      </div>
    </div>
    <div class="name">
      <div class="title">{{ row.name }}</div>
      <div v-if="situation" class="situation">
        <!-- Warning triangle -->
        <svg class="warning" viewBox="0 0 24 22" aria-hidden="true">
          <path d="M10.3 1.6a2 2 0 0 1 3.4 0l9.9 17.1a2 2 0 0 1-1.7 3H2.1a2 2 0 0 1-1.7-3z" fill="#f5c400" />
          <rect x="10.6" y="7" width="2.8" height="7.5" rx="1.2" fill="#000" />
          <circle cx="12" cy="17.6" r="1.6" fill="#000" />
        </svg>
        <span>{{ text(situation) }}</span>
      </div>
    </div>
    <div class="times" @click.stop="departures.length && toggleClock()">
      <template v-if="result && !result.found">
        <span class="dim">{{ t('row.notFound') }}</span>
        <RouterLink to="/config" class="fix">{{ t('row.edit') }}</RouterLink>
      </template>
      <span v-else-if="result && departures.length === 0" class="dim">{{ t('row.noDepartures') }}</span>
      <span
        v-for="departure in departures"
        v-else
        :key="departure.aimed"
        class="time"
        :class="{ scheduled: !departure.realtime }"
      >
        <span v-if="departure.cancelled" class="cancelled">{{ t('row.cancelled') }}</span>
        <template v-else>
          <s v-if="isDelayed(departure.aimed, departure.expected)" class="aimed">{{ formatClock(departure.aimed, clockFormat) }}</s>
          {{ showClock
              ? formatClock(departure.expected, clockFormat)
              : formatDeparture(departure.expected, now, { minutesLimit, nowText: t('row.now'), clockFormat }) }}
        </template>
      </span>
    </div>
  </li>
</template>

<style scoped>
.row {
  position: relative;
  display: grid;
  /* Columns come from the list in BoardView, so the badge column is as wide as
     the widest stop name on any row, and the row names line up. */
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
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

/* The stop name sits above the badge. */
.line {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stop {
  /* Room for the info marker, which sticks out above the badge. Same on every row, so they line up. */
  margin-bottom: 0.6em;
  font-size: 0.5em;
  color: var(--dim);
  white-space: nowrap;
  line-height: 1;
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
  display: flex;
  align-items: flex-start;
  gap: 0.4em;
  margin-top: 0.15em;
  font-size: 0.55em;
  color: var(--dim);
  line-height: 1.3;
}

.warning {
  flex: none;
  width: 1.35em;
  height: 1.25em;
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
