<script lang="tsx" setup>
import { DevLoggerUI } from 'devlog-ui'

const logsRef = useTemplateRef('logsRef')

onMounted(() => {
  if (!logsRef.value) {
    return
  }
  // 自己建 shadow, 方便覆盖日志列表的排列顺序与高度
  const host = document.createElement('div')
  host.className = 'h-full'
  logsRef.value.appendChild(host)
  const shadow = host.attachShadow({ mode: 'open' })

  DevLoggerUI.init({ shadow })

  const style = document.createElement('style')
  style.textContent = `
    :host { display: block; height: 100%; }
    /* 默认 min-height:400 / max-height:700 会撑出容器, 盖住下方岗位卡片 */
    .devlogger-container {
      height: 100%;
      min-height: 0;
      max-height: 100%;
      box-shadow: none;
      overflow: hidden;
    }
    .devlogger-logs {
      display: flex;
      flex-direction: column-reverse;
      justify-content: flex-start;
      min-height: 0;
    }
  `
  shadow.appendChild(style)
})
</script>

<template>
  <div ref="logsRef" class="h-80 overflow-hidden rounded-xl border border-[color:var(--color-bh-line)]" />
</template>
