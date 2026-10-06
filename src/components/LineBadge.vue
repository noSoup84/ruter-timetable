<script setup lang="ts">
import { computed } from 'vue'
import type { TransportMode } from '../lib/config'
import { badgeColours } from '../lib/departures'
import type { LineColours } from '../lib/entur'

const props = defineProps<{
  mode: TransportMode
  publicCode: string
  colours: LineColours | null
}>()

const style = computed(() => badgeColours(props.mode, props.colours))
</script>

<template>
  <span class="badge" :style="style">{{ publicCode }}</span>
</template>

<style scoped>
.badge {
  display: inline-block;
  min-width: 2.2em;
  padding: 0.1em 0.35em;
  border-radius: 0.2em;
  font-weight: 700;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
</style>
