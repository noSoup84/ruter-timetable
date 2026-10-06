<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AddRows from '../components/AddRows.vue'
import LineBadge from '../components/LineBadge.vue'
import { useConfig } from '../composables/useConfig'
import { clearConfig, encodeConfig, type BoardRow } from '../lib/config'

const router = useRouter()
const config = useConfig()
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
  if (!confirm(`Slette "${row.name}"?`)) return
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
  if (!(field instanceof HTMLInputElement) || field.readOnly || !['text', 'search'].includes(field.type)) return
  setTimeout(() => field.scrollIntoView({ block: field.type === 'search' ? 'start' : 'center', behavior: 'smooth' }), 300)
}

function reload() {
  location.reload()
}

function reset() {
  if (!confirm('Slette alle avganger og innstillinger på denne enheten?')) return
  clearConfig()
  // A full reload also forgets the position choice, which is only kept in memory.
  location.replace(`${location.pathname}#/`)
  location.reload()
}
</script>

<template>
  <main class="config form-page" @focusin="revealField">
    <header class="topbar">
      <button class="back" @click="router.push('/')">← Avganger</button>
      <h1>Innstillinger</h1>
    </header>

    <section>
      <h2>Avganger</h2>
      <p v-if="config.rows.length === 0" class="hint">Ingen avganger er lagt til ennå.</p>
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
            aria-label="Dra for å flytte"
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
            <input v-model="row.name" type="text" aria-label="Navn" />
            <span class="hint">Fra {{ row.stopName }}</span>
          </div>
          <button aria-label="Slett" @click="remove(row)">Slett</button>
        </li>
      </TransitionGroup>
      <AddRows v-if="adding" :existing="config.rows" @add="add" @cancel="adding = false" />
      <button v-else class="primary" @click="adding = true">Legg til avganger</button>
    </section>

    <section>
      <h2>Automatisk omlasting</h2>
      <p class="hint">Laster siden på nytt én gang i døgnet, slik at nye versjoner kommer ut.</p>
      <div class="reload">
        <label class="inline">
          <input v-model="config.autoReload.enabled" type="checkbox" />
          Last inn på nytt hver dag klokka
        </label>
        <input v-model="config.autoReload.time" type="time" :disabled="!config.autoReload.enabled" required />
        <button @click="reload">Last inn siden på nytt</button>
      </div>
    </section>

    <section>
      <h2>Eksport</h2>
      <p class="hint">Lag en lenke med hele oppsettet. Åpne lenken på en annen enhet for å kopiere oppsettet dit.</p>
      <div class="actions">
        <button @click="createExportUrl">Lag lenke</button>
      </div>
      <div v-if="exportUrl" class="export">
        <input :value="exportUrl" type="text" readonly @focus="($event.target as HTMLInputElement).select()" />
        <button @click="copyExportUrl">{{ copied ? 'Kopiert' : 'Kopier' }}</button>
      </div>
    </section>

    <section>
      <h2>Tilbakestill</h2>
      <p class="hint">
        Sletter alle avganger og innstillinger på denne enheten, og glemmer svaret om posisjon. Tillatelsen nettleseren
        har gitt til posisjon, må fjernes i nettleserens innstillinger for nettstedet.
      </p>
      <div class="actions">
        <button class="danger" @click="reset">Tilbakestill alt</button>
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
