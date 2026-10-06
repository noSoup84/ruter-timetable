<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AddRows from '../components/AddRows.vue'
import LanguageSelector from '../components/LanguageSelector.vue'
import LineBadge from '../components/LineBadge.vue'
import { useConfig } from '../composables/useConfig'
import { useI18n } from '../composables/useI18n'
import { CLOCK_FORMATS } from '../lib/format'
import { LIMITS, MAX_ROWS, MAX_TEXT_LENGTH, clearConfig, encodeConfig, validSetting, type BoardRow } from '../lib/config'

const router = useRouter()
const config = useConfig()
const { t } = useI18n()
const adding = ref(false)
const exportUrl = ref<string | null>(null)
const copied = ref(false)

function add(rows: BoardRow[]) {
  config.value.rows.push(...rows)
  adding.value = false
}

// Drag to reorder. Pointer events work for both touch and mouse, which
// native HTML drag and drop does not on iPad.

/** Scroll the page when dragging this close to the top or bottom edge. */
const SCROLL_EDGE = 80

const rowElements = new Map<string, HTMLElement>()
const draggingId = ref<string | null>(null)

function setRowElement(id: string, element: unknown) {
  if (element instanceof HTMLElement) rowElements.set(id, element)
  else rowElements.delete(id)
}

function middleOf(id: string | undefined): number | null {
  const rect = id ? rowElements.get(id)?.getBoundingClientRect() : undefined
  return rect ? rect.top + rect.height / 2 : null
}

function startDrag(event: PointerEvent, row: BoardRow) {
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  draggingId.value = row.id
}

function drag(event: PointerEvent) {
  if (!draggingId.value) return
  const rows = config.value.rows
  let index = rows.findIndex((r) => r.id === draggingId.value)

  // Swap with a neighbour once the pointer passes its middle.
  for (;;) {
    const above = middleOf(rows[index - 1]?.id)
    const below = middleOf(rows[index + 1]?.id)
    const target = above !== null && event.clientY < above ? index - 1 : below !== null && event.clientY > below ? index + 1 : index
    if (target === index) break
    const [row] = rows.splice(index, 1)
    rows.splice(target, 0, row)
    index = target
  }

  if (event.clientY < SCROLL_EDGE) window.scrollBy(0, -12)
  else if (event.clientY > window.innerHeight - SCROLL_EDGE) window.scrollBy(0, 12)
}

function endDrag() {
  draggingId.value = null
}

function remove(row: BoardRow) {
  if (!confirm(t('config.confirmDelete', { name: row.name }))) return
  config.value.rows = config.value.rows.filter((r) => r.id !== row.id)
}

function createExportUrl() {
  const base = `${location.origin}${location.pathname}`
  exportUrl.value = `${base}#/import?c=${encodeConfig(config.value)}`
  copied.value = false
}

async function copyExportUrl() {
  if (!exportUrl.value) return
  await navigator.clipboard.writeText(exportUrl.value)
  copied.value = true
}

/**
 * Scrolls a focused text field into view once the virtual keyboard is open.
 * The search field goes to the top, so its results have room above the keyboard.
 */
function revealField(event: FocusEvent) {
  const field = event.target
  if (!(field instanceof HTMLInputElement) || field.readOnly || !['text', 'search', 'number'].includes(field.type)) return
  setTimeout(() => field.scrollIntoView({ block: field.type === 'search' ? 'start' : 'center', behavior: 'smooth' }), 300)
}

/** Saves a number setting if it is valid, otherwise puts the field back to the saved value. */
function setNumber(key: keyof typeof LIMITS, event: Event) {
  const field = event.target as HTMLInputElement
  const value = validSetting(key, field.valueAsNumber)
  if (value === null) field.value = String(config.value[key])
  else config.value[key] = value
}

function reload() {
  location.reload()
}

function reset() {
  if (!confirm(t('config.confirmReset'))) return
  clearConfig()
  // A full reload also forgets the position choice, which is only kept in memory.
  location.replace(`${location.pathname}#/`)
  location.reload()
}
</script>

<template>
  <main class="config form-page" @focusin="revealField">
    <header class="topbar">
      <button class="back" @click="router.push('/')">{{ t('config.back') }}</button>
      <h1>{{ t('config.title') }}</h1>
      <LanguageSelector class="language-selector" />
    </header>

    <section>
      <h2>{{ t('config.departures') }}</h2>
      <p v-if="config.rows.length === 0" class="hint">{{ t('config.noRows') }}</p>
      <TransitionGroup tag="ul" name="reorder" class="rows">
        <li
          v-for="row in config.rows"
          :key="row.id"
          :ref="(element) => setRowElement(row.id, element)"
          class="row"
          :class="{ dragging: draggingId === row.id }"
        >
          <button
            class="handle"
            :aria-label="t('config.dragHandle')"
            @pointerdown="startDrag($event, row)"
            @pointermove="drag"
            @pointerup="endDrag"
            @pointercancel="endDrag"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
              <circle cx="9" cy="6" r="1.6" />
              <circle cx="15" cy="6" r="1.6" />
              <circle cx="9" cy="12" r="1.6" />
              <circle cx="15" cy="12" r="1.6" />
              <circle cx="9" cy="18" r="1.6" />
              <circle cx="15" cy="18" r="1.6" />
            </svg>
          </button>
          <LineBadge :mode="row.transportMode" :public-code="row.publicCode" :colours="null" />
          <div class="details">
            <input v-model="row.name" type="text" :maxlength="MAX_TEXT_LENGTH" :aria-label="t('config.name')" />
            <span class="hint">{{ t('config.from', { stop: row.stopName }) }}</span>
          </div>
          <button @click="remove(row)">{{ t('config.delete') }}</button>
        </li>
      </TransitionGroup>
      <AddRows v-if="adding" :existing="config.rows" @add="add" @cancel="adding = false" />
      <p v-else-if="config.rows.length >= MAX_ROWS" class="hint">{{ t('config.maxRows', { max: MAX_ROWS }) }}</p>
      <button v-else class="primary" @click="adding = true">{{ t('config.addDepartures') }}</button>
    </section>

    <section>
      <h2>{{ t('config.display') }}</h2>
      <div class="settings">
        <label class="setting">
          <span>{{ t('config.minutesBefore') }}</span>
          <input
            type="number"
            inputmode="numeric"
            :min="LIMITS.minutesLimit.min"
            :max="LIMITS.minutesLimit.max"
            :value="config.minutesLimit"
            @change="setNumber('minutesLimit', $event)"
          />
          <span>{{ t('config.minutesAfter') }}</span>
        </label>
        <label class="setting">
          <span>{{ t('config.distanceBefore') }}</span>
          <input
            type="number"
            inputmode="numeric"
            step="50"
            :min="LIMITS.nearbyDistance.min"
            :max="LIMITS.nearbyDistance.max"
            :value="config.nearbyDistance"
            @change="setNumber('nearbyDistance', $event)"
          />
          <span>{{ t('config.distanceAfter') }}</span>
        </label>
        <div class="setting" role="group" :aria-label="t('config.clockFormat')">
          <span>{{ t('config.clockFormat') }}</span>
          <div class="segmented">
            <button
              v-for="format in CLOCK_FORMATS"
              :key="format"
              :class="{ active: config.clockFormat === format }"
              :aria-pressed="config.clockFormat === format"
              @click="config.clockFormat = format"
            >
              {{ format === '24h' ? '24h · 14:05' : '12h · 2:05 PM' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section>
      <h2>{{ t('config.autoReload') }}</h2>
      <p class="hint">{{ t('config.autoReloadHint') }}</p>
      <div class="reload">
        <label class="inline">
          <input v-model="config.autoReload.enabled" type="checkbox" />
          {{ t('config.autoReloadLabel') }}
        </label>
        <input v-model="config.autoReload.time" type="time" :disabled="!config.autoReload.enabled" required />
        <button @click="reload">{{ t('config.reloadNow') }}</button>
      </div>
    </section>

    <section>
      <h2>{{ t('config.export') }}</h2>
      <p class="hint">{{ t('config.exportHint') }}</p>
      <div class="actions">
        <button @click="createExportUrl">{{ t('config.createLink') }}</button>
      </div>
      <div v-if="exportUrl" class="export">
        <input :value="exportUrl" type="text" readonly @focus="($event.target as HTMLInputElement).select()" />
        <button @click="copyExportUrl">{{ copied ? t('config.copied') : t('config.copy') }}</button>
      </div>
    </section>

    <section>
      <h2>{{ t('config.reset') }}</h2>
      <p class="hint">{{ t('config.resetHint') }}</p>
      <div class="actions">
        <button class="danger" @click="reset">{{ t('config.resetButton') }}</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.config {
  max-width: 56rem;
  margin: 0 auto;
  /* Room at the bottom, so the last fields can scroll above the virtual keyboard. */
  padding: 0 1.5rem 50vh;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}

.language-selector {
  margin-left: auto;
}

h1 {
  margin: 0;
  font-size: 1.6rem;
}

h2 {
  font-size: 1.2rem;
  margin: 2rem 0 0.5rem;
}

.hint {
  color: var(--dim);
  font-size: 0.95rem;
}

.rows {
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
}

.row {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--border);
}

.details {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.details input {
  width: 100%;
}

.row.dragging {
  position: relative;
  z-index: 1;
  background: var(--surface);
  box-shadow: 0 0.5rem 1.5rem rgb(0 0 0 / 0.8);
}

.reorder-move {
  transition: transform 0.15s ease;
}

.handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  padding: 0;
  border: none;
  background: none;
  color: var(--dim);
  cursor: grab;
  /* Stops the page from scrolling while dragging on touch screens. */
  touch-action: none;
}

.dragging .handle {
  color: var(--text);
  cursor: grabbing;
}

.inline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.settings {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.setting {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}

.setting input {
  width: 6rem;
  text-align: right;
}

.segmented {
  display: flex;
  gap: 0.5rem;
}

.segmented button {
  opacity: 0.55;
}

.segmented button.active {
  border-color: var(--accent);
  opacity: 1;
}

.reload {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.actions {
  margin-top: 1rem;
}

.danger {
  border-color: var(--red);
  color: var(--red);
}

.export {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.export input {
  flex: 1;
  min-width: 0;
}
</style>
