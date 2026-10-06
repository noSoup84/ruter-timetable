import { ref, watch } from 'vue'
import { loadConfig, saveConfig, type AppConfig } from '../lib/config'

const config = ref<AppConfig>(loadConfig())

watch(config, (value) => saveConfig(value), { deep: true })

/** The app config, shared by all views and saved to localStorage on every change. */
export function useConfig() {
  return config
}
