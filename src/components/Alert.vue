<script setup lang="ts">
import type { AlertProps } from '@nuxt/ui/components/Alert.vue'
import { computed, onMounted, ref } from 'vue'

import { counter } from '@/message'

export interface ExtendedAlertProps extends /* @vue-ignore */ AlertProps {
  id?: string
  showIcon?: boolean
}

const props = defineProps<ExtendedAlertProps>()

const storageKey = computed(() => `local:alert:${props.id}`)
const open = ref(true)

onMounted(async () => {
  if (!props.id) {
    return
  }
  const shouldHide = await counter.storageGet(storageKey.value, false)
  open.value = !shouldHide
})

/**
 * Nuxt UI 的 UAlert 关闭按钮是通过 update:open 事件通知的,
 * 之前只监听 @close 所以点了 × 完全没反应。
 */
async function onUpdateOpen(value: boolean) {
  open.value = value
  if (value) {
    return
  }
  if (props.id) {
    await counter.storageSet(storageKey.value, true)
  }
}

const icon = computed(() => {
  if (props.icon) return props.icon
  if (props.showIcon === false) return null
  switch (props.color) {
    case 'success':
      return 'solar:check-circle-outline'
    case 'error':
      return 'solar:close-circle-outline'
    case 'warning':
      return 'solar:shield-warning-outline'
    default:
      return 'solar:info-circle-outline'
  }
})
</script>

<template>
  <UAlert
    v-if="open"
    :open="open"
    v-bind="props"
    @update:open="onUpdateOpen"
    :close="props.close ? props.close : props.id ? true : undefined"
    :icon="icon"
    :color="props.color ?? 'info'"
    :variant="props.variant ?? 'subtle'"
    :orientation="props.orientation ?? 'horizontal'"
    :ui="{ root: 'rounded-xl border border-[#e8eef5]' }"
  >
    <slot />
    <template #title>
      <slot name="title"></slot>
    </template>
    <template #description>
      <slot name="description"></slot>
    </template>
  </UAlert>
</template>
