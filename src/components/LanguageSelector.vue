<script setup lang="ts">
import { useConfig } from '../composables/useConfig'
import type { Language } from '../lib/i18n'

const config = useConfig()

// Each language is labelled in its own language, so it can be found from either one.
const OPTIONS: { language: Language; label: string }[] = [
  { language: 'no', label: 'Norsk' },
  { language: 'en', label: 'English' },
]
</script>

<template>
  <div class="languages" role="group" aria-label="Språk / Language">
    <button
      v-for="option in OPTIONS"
      :key="option.language"
      class="language"
      :class="{ active: config.language === option.language }"
      :aria-pressed="config.language === option.language"
      :aria-label="option.label"
      :title="option.label"
      @click="config.language = option.language"
    >
      <!-- Flag of Norway -->
      <svg v-if="option.language === 'no'" viewBox="0 0 22 16" aria-hidden="true">
        <rect width="22" height="16" fill="#BA0C2F" />
        <rect x="6" width="4" height="16" fill="#fff" />
        <rect y="6" width="22" height="4" fill="#fff" />
        <rect x="7" width="2" height="16" fill="#00205B" />
        <rect y="7" width="22" height="2" fill="#00205B" />
      </svg>
      <!-- Flag of the United Kingdom -->
      <svg v-else viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <clipPath id="uk-flag-diagonals">
          <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
        </clipPath>
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#uk-flag-diagonals)" stroke="#C8102E" stroke-width="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.languages {
  display: flex;
  gap: 0.5rem;
}

.language {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  padding: 0.4rem;
  border: 2px solid var(--border);
  opacity: 0.45;
}

.language.active {
  border-color: var(--accent);
  opacity: 1;
}

svg {
  display: block;
  width: 2.25rem;
  height: 1.5rem;
  border-radius: 0.15rem;
}
</style>
