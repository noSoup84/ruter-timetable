import { computed } from 'vue'
import { pickText, translate, type LocalizedText, type MessageKey } from '../lib/i18n'
import { useConfig } from './useConfig'

/** Translation helpers for the language chosen in the config. */
export function useI18n() {
  const config = useConfig()
  const language = computed(() => config.value.language)

  const t = (key: MessageKey, params?: Record<string, string | number>) => translate(language.value, key, params)
  const text = (value: LocalizedText) => pickText(value, language.value)

  return { language, t, text }
}
