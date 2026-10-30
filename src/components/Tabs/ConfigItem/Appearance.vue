<script lang="ts" setup>
import { computed, watch, watchEffect } from 'vue'
import { useFavicon, useTitle } from '@vueuse/core'

import Alert from '@/components/Alert.vue'
import { useConf, appearanceConf } from '@/composables/conf'
import { useHelper } from '@/composables/useHelper'
import { resolveTheme, themePresets } from '@/composables/useTheme'

const title = useTitle(undefined, { observe: true })
const helper = useHelper()
const { todayData } = helper.statistics
const { formData } = useConf()

const currentAccent = computed(
  () => resolveTheme(appearanceConf.value.themeId, appearanceConf.value.accentColor).accent,
)

function pickTheme(id: string) {
  appearanceConf.value.themeId = id
  appearanceConf.value.accentColor = ''
}

watch(
  () => appearanceConf.value.changeIcon,
  (v) => {
    if (!v) {
      return
    }
    const icon = useFavicon()
    icon.value = 'https://onlinecalculator.cc/public/favicon.svg'
  },
)

let dynamicTitle: ReturnType<typeof watchEffect> | null = null

watch(
  () => appearanceConf.value.dynamicTitle,
  (val) => {
    if (!val) {
      dynamicTitle?.stop()
    } else {
      dynamicTitle = watchEffect(() => {
        title.value = `${todayData.value.success}/${formData.deliveryLimit.value} - 在线计算器`
      })
    }
  },
)

let ticking = false

watch(
  () => appearanceConf.value.blurCard,
  (val) => {
    const root = document.querySelector('boss-helper-job')?.shadowRoot
    if (!root) return
    const card = root.querySelector<HTMLDivElement>('.boss-helper-card')
    const blur = card?.querySelector<HTMLDivElement>('.card-grid-overlay')
    if (!blur || !card) return
    if (!val) {
      blur.style.display = 'none'
      card.onmousemove = null
      card.onmouseleave = null
    } else {
      blur.style.display = 'unset'
      card.onmousemove = (e) => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const rect = card.getBoundingClientRect()
            card.style.setProperty('--x', `${e.clientX - rect.left}px`)
            card.style.setProperty('--y', `${e.clientY - rect.top}px`)
            card.style.setProperty('--r', '120px')
            ticking = false
          })
          ticking = true
        }
        card.onmouseleave = () => {
          card.style.setProperty('--r', '0px')
        }
      }
    }
  },
)

watch(
  () => appearanceConf.value.listSink,
  (val) => {
    const h = document.getElementById('boss-helper-job-warp')
    if (!h) return
    h.style.marginBottom = val ? '300px' : 'unset'
  },
)
</script>

<template>
  <div class="flex flex-col gap-3">
    <Alert
      id="appearance-alert-1"
      color="info"
      description="外观设置会自动保存，无需点击保存配置。"
    />

    <section class="flex flex-col gap-2">
      <div class="text-[13px] font-medium">配色主题</div>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="theme in themePresets"
          :key="theme.id"
          type="button"
          class="bh-pill inline-flex items-center gap-1.5"
          :class="appearanceConf.themeId === theme.id ? 'bh-pill-active' : ''"
          @click="pickTheme(theme.id)"
        >
          <span class="size-2.5 rounded-full" :style="{ background: theme.colors.accent }" />
          <span class="size-2.5 rounded-full" :style="{ background: theme.colors.bg }" />
          <span class="size-2.5 rounded-full" :style="{ background: theme.colors.ink }" />
          <span class="ml-0.5">{{ theme.name }}</span>
        </button>
      </div>
      <div class="flex flex-wrap gap-2 items-center">
        <span class="bh-muted text-xs">自定义强调色</span>
        <input
          type="color"
          class="size-7 cursor-pointer rounded border border-[color:var(--color-bh-line)] bg-transparent p-0"
          :value="currentAccent"
          @input="
            (e) => {
              appearanceConf.accentColor = (e.target as HTMLInputElement).value
            }
          "
        />
        <UButton
          v-if="appearanceConf.accentColor"
          size="xs"
          color="neutral"
          variant="soft"
          @click="appearanceConf.accentColor = ''"
        >
          恢复预设
        </UButton>
      </div>
    </section>

    <section class="flex flex-col gap-2">
      <div class="text-[13px] font-medium">显示</div>
      <div class="flex flex-wrap gap-x-4 gap-y-2">
        <UCheckbox v-model="appearanceConf.hideHeader" label="隐藏标题" />
        <UCheckbox v-model="appearanceConf.blurCard" label="卡片跟随模糊" />
        <UCheckbox v-model="appearanceConf.listSink" label="列表下沉" />
        <UCheckbox v-model="appearanceConf.changeIcon" label="更换图标" />
        <UCheckbox v-model="appearanceConf.dynamicTitle" label="动态标题" />
      </div>
    </section>

    <section class="flex flex-wrap gap-3 items-end">
      <UFormField label="内容偏移">
        <UInputNumber
          v-model="appearanceConf.contentOffset"
          :step="0.5"
          :min="0"
          :max="30"
          size="sm"
          class="w-24"
        />
      </UFormField>
    </section>
  </div>
</template>
