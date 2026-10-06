<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfig } from '../composables/useConfig'
import { decodeConfig } from '../lib/config'

const route = useRoute()
const router = useRouter()
const config = useConfig()

const imported = computed(() => (typeof route.query.c === 'string' ? decodeConfig(route.query.c) : null))

function confirmImport() {
  if (!imported.value) return
  config.value = imported.value
  router.replace('/')
}
</script>

<template>
  <main class="import">
    <h1>Importer oppsett</h1>
    <template v-if="imported">
      <p>Lenken inneholder disse avgangene:</p>
      <ul>
        <li v-for="row in imported.rows" :key="row.id">{{ row.name }} <span class="hint">fra {{ row.stopName }}</span></li>
      </ul>
      <p v-if="config.rows.length" class="warning">
        Dette erstatter de {{ config.rows.length }} avgangene som er satt opp på denne enheten.
      </p>
      <div class="actions">
        <button class="primary" @click="confirmImport">Bruk dette oppsettet</button>
        <RouterLink to="/config">Avbryt</RouterLink>
      </div>
    </template>
    <template v-else>
      <p class="warning">Lenken er ugyldig eller ufullstendig.</p>
      <RouterLink to="/config">Til innstillinger</RouterLink>
    </template>
  </main>
</template>

<style scoped>
.import {
  max-width: 44rem;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.hint {
  color: var(--dim);
}

.warning {
  color: #f5c400;
}

.actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
}
</style>
