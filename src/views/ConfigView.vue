<script setup lang="ts">
import { ref } from 'vue'
import AddRows from '../components/AddRows.vue'
import LineBadge from '../components/LineBadge.vue'
import { useConfig } from '../composables/useConfig'
import { clearConfig, encodeConfig, type BoardRow } from '../lib/config'

const config = useConfig()
const adding = ref(false)
const exportUrl = ref<string | null>(null)
const copied = ref(false)

function add(rows: BoardRow[]) {
  config.value.rows.push(...rows)
  adding.value = false
}

function move(index: number, offset: number) {
  const rows = config.value.rows
  const [row] = rows.splice(index, 1)
  rows.splice(index + offset, 0, row)
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
  <main class="config">
    <header>
      <h1>Innstillinger</h1>
      <RouterLink to="/">Tilbake til avganger</RouterLink>
    </header>

    <section>
      <h2>Avganger</h2>
      <p v-if="config.rows.length === 0" class="hint">Ingen avganger er lagt til ennå.</p>
      <ul class="rows">
        <li v-for="(row, index) in config.rows" :key="row.id" class="row">
          <LineBadge :mode="row.transportMode" :public-code="row.publicCode" :colours="null" />
          <div class="details">
            <input v-model="row.name" type="text" aria-label="Navn" />
            <span class="hint">Fra {{ row.stopName }}</span>
          </div>
          <div class="buttons">
            <button :disabled="index === 0" aria-label="Flytt opp" @click="move(index, -1)">↑</button>
            <button :disabled="index === config.rows.length - 1" aria-label="Flytt ned" @click="move(index, 1)">
              ↓
            </button>
            <button aria-label="Slett" @click="remove(row)">Slett</button>
          </div>
        </li>
      </ul>
      <AddRows v-if="adding" :existing="config.rows" @add="add" @cancel="adding = false" />
      <button v-else class="primary" @click="adding = true">Legg til avganger</button>
    </section>

    <section>
      <h2>Automatisk omlasting</h2>
      <p class="hint">Laster siden på nytt én gang i døgnet, slik at nye versjoner kommer ut.</p>
      <label class="inline">
        <input v-model="config.autoReload.enabled" type="checkbox" />
        Last inn på nytt hver dag klokka
      </label>
      <input v-model="config.autoReload.time" type="time" :disabled="!config.autoReload.enabled" required />
      <div class="actions">
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
  max-width: 44rem;
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
}

h1 {
  font-size: 1.6rem;
}

h2 {
  font-size: 1.2rem;
  margin: 2rem 0 0.5rem;
}

.hint {
  color: var(--dim);
  font-size: 0.9rem;
}

.rows {
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
}

.row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
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

.buttons {
  display: flex;
  gap: 0.3rem;
}

.inline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: 0.5rem;
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
