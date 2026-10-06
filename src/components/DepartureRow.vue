<script setup lang="ts">
import { computed } from 'vue'
import type { BoardRow } from '../lib/config'
import { firstSituation, notices, upcoming } from '../lib/departures'
import type { RowResult } from '../lib/entur'
import { formatClock, formatDeparture, isDelayed } from '../lib/format'
import LineBadge from './LineBadge.vue'

const props = defineProps<{
  row: BoardRow
  result: RowResult | undefined
  now: number
  noticeOpen: boolean
}>()

const emit = defineEmits<{ toggleNotice: [] }>()

const departures = computed(() => (props.result?.found ? upcoming(props.result.departures, props.now) : []))
const situation = computed(() => (props.result?.found ? firstSituation(props.result.departures) : null))
const rowNotices = computed(() => (props.result?.found ? notices(props.result.departures) : []))
const colours = computed(() => (props.result?.found ? props.result.colours : null))
</script>

<template>
  <li class="row">
    <LineBadge class="badge" :mode="row.transportMode" :public-code="row.publicCode" :colours="colours" />
    <div class="name">
      <div class="title">
        <span class="title-text">{{ row.name }}</span>
        <button
          v-if="rowNotices.length"
          class="info"
          :class="{ open: noticeOpen }"
          :aria-expanded="noticeOpen"
          aria-label="Vis informasjon"
          @click.stop="emit('toggleNotice')"
        >
          i
        </button>
      </div>
      <div v-if="noticeOpen && rowNotices.length" class="bubble" @click.stop>
        <div v-for="notice in rowNotices" :key="notice.summary" class="notice">
          <p class="notice-summary">{{ notice.summary }}</p>
          <p v-if="notice.description" class="notice-description">{{ notice.description }}</p>
        </div>
      </div>
      <div v-if="situation" class="situation">
        <span class="warning" aria-hidden="true">!</span>{{ situation }}
      </div>
    </div>
    <div class="times">
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
          {{ formatDeparture(departure.expected, now) }}
        </template>
      </span>
    </div>
  </li>
</template>

<style scoped>
.row {
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

.name {
  position: relative;
}

.title {
  display: flex;
  align-items: center;
  gap: 0.35em;
  font-weight: 600;
}

.title-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info {
  flex: none;
  width: 1.1em;
  height: 1.1em;
  padding: 0;
  border: 1px solid var(--dim);
  border-radius: 50%;
  background: none;
  color: var(--dim);
  font-size: 0.6em;
  font-weight: 700;
  font-style: italic;
  font-family: Georgia, serif;
  line-height: 1;
}

.info.open {
  border-color: var(--text);
  color: var(--text);
}

.bubble {
  position: absolute;
  z-index: 2;
  top: calc(100% + 0.5em);
  left: 0;
  width: min(36em, 85vw);
  padding: 0.7em 0.9em;
  border: 1px solid var(--border);
  border-radius: 0.5em;
  background: var(--surface);
  box-shadow: 0 0.5em 2em rgb(0 0 0 / 0.7);
  font-size: 0.5em;
  font-weight: 400;
}

/* The tail of the speech bubble, pointing up at the name. */
.bubble::before {
  content: '';
  position: absolute;
  top: -0.5em;
  left: 1.5em;
  width: 1em;
  height: 1em;
  background: var(--surface);
  border-left: 1px solid var(--border);
  border-top: 1px solid var(--border);
  transform: rotate(45deg);
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
  gap: 0.9em;
  justify-content: flex-end;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.time {
  min-width: 3.6em;
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
