<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfig } from '../composables/useConfig'
import { useI18n } from '../composables/useI18n'
import { decodeConfig } from '../lib/config'

const route = useRoute()
const router = useRouter()
const config = useConfig()
const { t } = useI18n()

const imported = computed(() => (typeof route.query.c === 'string' ? decodeConfig(route.query.c) : null))

function confirmImport() {
  if (!imported.value) return
  config.value = imported.value
  router.replace('/')
}
</script>

<template>
  <main class="import form-page">
    <h1>{{ t('import.title') }}</h1>
    <template v-if="imported">
      <p>{{ t('import.contains') }}</p>
      <ul>
        <li v-for="row in imported.rows" :key="row.id">{{ row.name }} <span class="hint">{{ t('import.from', { stop: row.stopName }) }}</span></li>
      </ul>
      <p v-if="config.rows.length" class="warning">
        {{ t('import.replaces', { count: config.rows.length }) }}
      </p>
      <div class="actions">
        <button class="primary" @click="confirmImport">{{ t('import.confirm') }}</button>
        <RouterLink to="/config">{{ t('import.cancel') }}</RouterLink>
      </div>
    </template>
    <template v-else>
      <p class="warning">{{ t('import.invalid') }}</p>
      <RouterLink to="/config">{{ t('import.toSettings') }}</RouterLink>
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
