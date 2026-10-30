<script lang="ts" setup>
import type { TabsItem } from '@nuxt/ui'
import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue'

import JobCards from '@/components/JobCards.vue'
import Version from '@/components/Menu/Version.vue'
import About from '@/components/Tabs/About.vue'
import Ai from '@/components/Tabs/AI.vue'
import Config from '@/components/Tabs/Config.vue'
import Filter from '@/components/Tabs/Filter.vue'
import Logs from '@/components/Tabs/Logs.vue'
import Statistics from '@/components/Tabs/Statistics.vue'
import { useConf, appearanceConf } from '@/composables/conf'
import { useModel } from '@/composables/useModel'
import { applyThemeVars, resolveTheme } from '@/composables/useTheme'

import { useHelper, VITE_VERSION_SHORT } from './composables/useHelper'

const model = useModel()

const helper = useHelper()
const { todayData } = helper.statistics
const conf = useConf()

const items = computed<TabsItem[]>(() => {
  const configs = [
    { slot: 'statistics', label: '统计' },
    { slot: 'filter', label: '筛选' },
    { slot: 'config', label: '配置' },
    { slot: 'ai', label: 'AI' },
    { slot: 'logs', label: '日志' },
    { slot: 'about', label: '关于' },
  ] satisfies (TabsItem | boolean | null | undefined | '')[]

  return configs.filter((item) => !!item) as TabsItem[]
})

const container = ref<HTMLElement>()
let root: ShadowRoot | Document = document

/* ---------------- 配色 ---------------- */
watchEffect(() => {
  if (!container.value) {
    return
  }
  const colors = resolveTheme(appearanceConf.value.themeId, appearanceConf.value.accentColor)
  applyThemeVars(container.value, colors)
})

/* ---------------- 帮助模式 ---------------- */
const helpEnabled = ref(false)
const helpVisible = ref(false)
const helpContent = ref('')
const anchor = ref({ x: 0, y: 0 })
const boxStyles = ref({
  display: 'none',
  width: '0px',
  height: '0px',
  transform: 'translate(0, 0)',
})

const reference = computed(() => ({
  getBoundingClientRect: () =>
    ({
      width: 0,
      height: 0,
      left: anchor.value.x,
      right: anchor.value.x,
      top: anchor.value.y,
      bottom: anchor.value.y,
    }) as DOMRect,
}))

function hideHelp() {
  helpVisible.value = false
  if (boxStyles.value.display !== 'none') {
    boxStyles.value = { ...boxStyles.value, display: 'none' }
  }
}

function updateHelp(x: number, y: number) {
  const target = root.elementFromPoint(x, y) as HTMLElement | null
  const el = target?.closest('[data-help]') as HTMLElement | null
  const help = el?.dataset.help?.trim() || ''
  if (!el || !help || help === 'no-help') {
    hideHelp()
    return
  }
  const rect = el.getBoundingClientRect()
  anchor.value = { x, y }
  helpContent.value = help
  boxStyles.value = {
    display: 'block',
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    transform: `translate(${rect.left}px, ${rect.top}px)`,
  }
  helpVisible.value = true
}

function onPointerMove(ev: PointerEvent) {
  if (!helpEnabled.value) {
    return
  }
  updateHelp(ev.clientX, ev.clientY)
}

watch(helpEnabled, (v) => {
  if (!v) {
    hideHelp()
  }
})

onMounted(() => {
  root = (container.value?.getRootNode() as ShadowRoot) ?? document
  window.addEventListener('pointermove', onPointerMove, true)
  window.addEventListener('blur', hideHelp)
  void conf.confInit()
  void model.initModel()
})

onUnmounted(() => {
  window.removeEventListener('pointermove', onPointerMove, true)
  window.removeEventListener('blur', hideHelp)
})

/* ---------------- 关于弹窗 ---------------- */
const aboutOpen = ref(false)

const isDot = computed(() => {
  return (helper.netConf.value?.version ?? '0') > VITE_VERSION_SHORT
})
</script>

<template>
  <div
    class="shadow-wrapper w-238 max-w-238 min-w-238 m-6 mx-auto mb-10 bh-page"
    :style="{
      marginRight:
        appearanceConf.leftChat && appearanceConf.contentOffset != 25
          ? `${appearanceConf.contentOffset}%`
          : undefined,
      marginLeft:
        !appearanceConf.leftChat && appearanceConf.contentOffset != 25
          ? `${appearanceConf.contentOffset}%`
          : undefined,
    }"
    ref="container"
  >
    <UApp :portal="container" :toaster="{ position: 'top-right', ui: { viewport: 'z-100000' } }">
      <div class="overlay-box" :style="boxStyles" />
      <UTooltip
        :open="helpVisible"
        :reference="reference"
        :content="{
          side: 'top',
          sideOffset: 14,
          collisionPadding: 16,
          avoidCollisions: true,
          updatePositionStrategy: 'always',
        }"
        :text="helpContent"
        :ui="{
          content:
            'z-1000 flex items-center gap-1 bg-default text-highlighte shadow-lg rounded-lg ring-1 ring-default h-auto px-2.5 py-1.5 text-[13px] leading-snug select-none pointer-events-none opacity-100 wrap-break-word',
          text: 'whitespace-normal',
        }"
      />

      <div class="bh-shell px-3.5 pt-3 pb-3.5 flex flex-col gap-2.5">
        <header class="flex flex-wrap gap-2 items-center">
          <span class="bh-logo">B</span>
          <span class="bh-brand">boss-plugin</span>

          <div class="ml-auto flex flex-wrap gap-1.5 items-center justify-end">
            <span v-if="todayData.total > 0" class="bh-chip">
              今日 {{ todayData.success }}/{{ conf.formData.deliveryLimit.value }}
            </span>
            <span v-if="helper.workflow && helper.workflow.total.value > 0" class="bh-chip">
              进度 {{ helper.workflow.current.value }}/{{ helper.workflow.total.value }}
            </span>
            <UButton
              size="xs"
              :color="helpEnabled ? 'primary' : 'neutral'"
              :variant="helpEnabled ? 'soft' : 'ghost'"
              icon="i-lucide-circle-help"
              data-help="no-help"
              title="帮助模式：开启后鼠标悬停可查看说明"
              @click="helpEnabled = !helpEnabled"
            >
              帮助
            </UButton>
            <UChip :show="isDot" size="2xs">
              <UButton color="primary" variant="soft" size="xs" @click="aboutOpen = true">
                v{{ VITE_VERSION_SHORT }}{{ isDot ? ' 有更新' : '' }}
              </UButton>
            </UChip>
          </div>
        </header>

        <div v-if="helper.netConf.value && helper.netConf.value.notification" class="netAlerts">
          <template
            v-for="item in helper.netConf.value.notification.filter((item) => item.type === 'alert')"
            :key="item.key ?? item.data.title"
          >
            <Alert :id="`netConf-${item.key}`" v-bind="item.data" />
          </template>
        </div>

        <UTabs
          data-help="no-help"
          :items="items"
          variant="link"
          :ui="{
            list: 'bh-tablist',
            trigger: 'bh-tab',
            content: 'pt-1.5',
          }"
          :unmount-on-hide="false"
        >
          <template #statistics>
            <Statistics />
          </template>
          <template #filter>
            <Filter />
          </template>
          <template #config><Config /></template>
          <template #ai><Ai /></template>
          <template #logs><Logs /></template>
          <template #about><About /></template>
        </UTabs>
      </div>

      <JobCards />

      <UModal
        v-model:open="aboutOpen"
        title="关于 boss-plugin"
        :ui="{ content: 'sm:max-w-md rounded-2xl' }"
      >
        <template #body>
          <Version v-if="aboutOpen" />
        </template>
        <template #footer>
          <UButton color="neutral" variant="soft" @click="aboutOpen = false">关闭</UButton>
        </template>
      </UModal>
    </UApp>
  </div>
</template>
