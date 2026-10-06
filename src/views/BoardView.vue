<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DepartureRow from '../components/DepartureRow.vue'
import { useAutoReload } from '../composables/useAutoReload'
import { useConfig } from '../composables/useConfig'
import { useDepartures } from '../composables/useDepartures'
import { useNow } from '../composables/useNow'
import { formatClock } from '../lib/format'

/** Show "last updated" after this long without a successful fetch. */
const STALE_AFTER = 120_000

const config = useConfig()
const rows = computed(() => config.value.rows)
const now = useNow()
const { results, lastSuccess } = useDepartures(rows)
useAutoReload()
const startedAt = Date.now()

/** Close the info bubble by itself, so the board is not left with it open. */
const NOTICE_TIMEOUT = 20_000

const openNotice = ref<string | null>(null)
let noticeTimer: ReturnType<typeof setTimeout> | undefined

function toggleNotice(rowId: string) {
  openNotice.value = openNotice.value === rowId ? null : rowId
}

watch(openNotice, (id) => {
  clearTimeout(noticeTimer)
  if (id) noticeTimer = setTimeout(() => (openNotice.value = null), NOTICE_TIMEOUT)
})

const stale = computed(() => {
  if (rows.value.length === 0) return null
  if (lastSuccess.value === null) return now.value - startedAt > STALE_AFTER ? 'Får ikke kontakt med Entur' : null
  if (now.value - lastSuccess.value > STALE_AFTER) return `Sist oppdatert ${formatClock(lastSuccess.value)}`
  return null
})
</script>

<template>
  <main class="board" :style="{ '--rows': Math.max(rows.length, 3) }" @click="openNotice = null">
    <header class="clock">{{ formatClock(now) }}</header>

    <ul v-if="rows.length" class="rows">
      <DepartureRow
        v-for="row in rows"
        :key="row.id"
        :row="row"
        :result="results.get(row.id)"
        :now="now"
        :notice-open="openNotice === row.id"
        @toggle-notice="toggleNotice(row.id)"
      />
    </ul>
    <p v-else class="empty">
      Ingen avganger er satt opp.
      <RouterLink to="/config">Sett opp avganger</RouterLink>
    </p>

    <footer v-if="stale" class="stale">{{ stale }}</footer>

    <RouterLink to="/config" class="settings" aria-label="Innstillinger">
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        />
      </svg>
    </RouterLink>
  </main>
</template>

<style scoped>
/*
 * The font size is the largest that fits both the height and the width.
 * Height: the clock takes about 3em and each row about 2.8em.
 * Width: a row needs about 24em (badge, name, three times and a delayed time).
 * At least 3 rows are assumed, so a short list does not get huge text.
 */
.board {
  --pad-x: 4vmin;
  --pad-y: 3vmin;
  --clock-em: 3;
  --row-em: 2.8;
  --row-width-em: 24;

  display: flex;
  flex-direction: column;
  height: 100dvh;
  padding: var(--pad-y) var(--pad-x);
  font-size: max(
    1rem,
    min(
      calc((100dvh - 2 * var(--pad-y)) / (var(--clock-em) + var(--rows) * var(--row-em))),
      calc((100vw - 2 * var(--pad-x)) / var(--row-width-em))
    )
  );
  overflow: hidden;
}

/* In portrait the times go on their own line, so rows are taller and narrower. */
@media (orientation: portrait) {
  .board {
    --row-em: 4;
    --row-width-em: 17;
  }
}

.clock {
  font-size: 2em;
  font-weight: 300;
  font-variant-numeric: tabular-nums;
  margin-bottom: 0.3em;
}

.rows {
  display: flex;
  flex-direction: column;
  flex: 1;
  list-style: none;
  margin: 0;
  padding: 0;
}

/* Rows share the height that is left, so the list fills the screen. */
.rows > :deep(li) {
  flex: 1 1 0;
  max-height: calc(var(--row-em) * 1.6em);
}

.empty {
  color: var(--dim);
}

.stale {
  position: fixed;
  left: 4vmin;
  bottom: 3vmin;
  font-size: 0.5em;
  color: var(--dim);
}

.settings {
  position: fixed;
  right: 3vmin;
  bottom: 3vmin;
  width: clamp(1.5rem, 4vmin, 2.5rem);
  height: clamp(1.5rem, 4vmin, 2.5rem);
  color: var(--faint);
  cursor: pointer;
}
</style>
