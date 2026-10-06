<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DepartureRow from '../components/DepartureRow.vue'
import { useAutoReload } from '../composables/useAutoReload'
import { useConfig } from '../composables/useConfig'
import { useDepartures } from '../composables/useDepartures'
import { useI18n } from '../composables/useI18n'
import { useNow } from '../composables/useNow'
import { formatClock } from '../lib/format'

/** Show "last updated" after this long without a successful fetch. */
const STALE_AFTER = 120_000

const config = useConfig()
const { t } = useI18n()
const rows = computed(() => config.value.rows)
const now = useNow()
const { results, lastSuccess } = useDepartures(rows)
useAutoReload()
const startedAt = Date.now()

/** Close the info bubble when the screen has not been tapped for this long. */
const NOTICE_TIMEOUT = 10_000

const openNotice = ref<string | null>(null)
let noticeTimer: ReturnType<typeof setTimeout> | undefined

function toggleNotice(rowId: string) {
  openNotice.value = openNotice.value === rowId ? null : rowId
}

function restartNoticeTimer() {
  clearTimeout(noticeTimer)
  if (openNotice.value) noticeTimer = setTimeout(() => (openNotice.value = null), NOTICE_TIMEOUT)
}

watch(openNotice, restartNoticeTimer)

const stale = computed(() => {
  if (rows.value.length === 0) return null
  if (lastSuccess.value === null) return now.value - startedAt > STALE_AFTER ? t('board.noContact') : null
  if (now.value - lastSuccess.value > STALE_AFTER) return t('board.lastUpdated', { time: formatClock(lastSuccess.value, config.value.clockFormat) })
  return null
})
</script>

<template>
  <main
    class="board"
    :class="{ 'clock-12h': config.clockFormat === '12h' }"
    :style="{ '--rows': Math.max(rows.length, 3) }"
    @click="openNotice = null"
    @pointerdown.capture="restartNoticeTimer"
  >
    <header class="top">
      <RouterLink to="/config" class="settings" :aria-label="t('board.settings')">
        <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
          />
        </svg>
      </RouterLink>
      <div class="clock">{{ formatClock(now, config.clockFormat) }}</div>
    </header>

    <ul v-if="rows.length" class="rows">
      <DepartureRow
        v-for="row in rows"
        :key="row.id"
        :row="row"
        :result="results.get(row.id)"
        :now="now"
        :minutes-limit="config.minutesLimit"
        :clock-format="config.clockFormat"
        :notice-open="openNotice === row.id"
        @toggle-notice="toggleNotice(row.id)"
      />
    </ul>
    <p v-else class="empty">
      {{ t('board.empty') }}
      <RouterLink to="/config">{{ t('board.setUp') }}</RouterLink>
    </p>

    <footer v-if="stale" class="stale">{{ stale }}</footer>

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

/* "2:05 PM" is wider than "14:05". */
.board.clock-12h {
  --row-width-em: 28;
}

/* In portrait the times go on their own line, so rows are taller and narrower. */
@media (orientation: portrait) {
  .board {
    --row-em: 4;
    --row-width-em: 17;
  }
}

@media (orientation: portrait) {
  .board.clock-12h {
    --row-width-em: 20;
  }
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.3em;
}

.clock {
  font-size: 2em;
  font-weight: 300;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
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

/* A service alert wraps over several lines, so its row may grow past the cap. */
.rows > :deep(li:has(.situation)) {
  flex-shrink: 0;
  max-height: none;
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
  width: clamp(1.5rem, 4vmin, 2.5rem);
  height: clamp(1.5rem, 4vmin, 2.5rem);
  margin-top: 0.3em;
  color: var(--faint);
  cursor: pointer;
}
</style>
