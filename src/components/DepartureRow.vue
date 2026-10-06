<script setup lang="ts">
import { computed } from 'vue'
import type { BoardRow } from '../lib/config'
import { firstSituation, upcoming } from '../lib/departures'
import type { RowResult } from '../lib/entur'
import { formatClock, formatDeparture, isDelayed } from '../lib/format'
import LineBadge from './LineBadge.vue'

const props = defineProps<{
  row: BoardRow
  result: RowResult | undefined
  now: number
}>()

const departures = computed(() => (props.result?.found ? upcoming(props.result.departures, props.now) : []))
const situation = computed(() => (props.result?.found ? firstSituation(props.result.departures) : null))
const colours = computed(() => (props.result?.found ? props.result.colours : null))
</script>

<template>
  <li class="row">
    <LineBadge class="badge" :mode="row.transportMode" :public-code="row.publicCode" :colours="colours" />
    <div class="name">
      <div class="title">{{ row.name }}</div>
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

.title {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
