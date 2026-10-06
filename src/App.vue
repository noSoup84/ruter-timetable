<script setup lang="ts">
import { watchEffect } from 'vue'
import { useI18n } from './composables/useI18n'
import { LANGUAGE_TAGS } from './lib/i18n'

const { language, t } = useI18n()

watchEffect(() => {
  document.documentElement.lang = LANGUAGE_TAGS[language.value]
  document.title = t('app.title')
})
</script>

<template>
  <RouterView />
</template>
