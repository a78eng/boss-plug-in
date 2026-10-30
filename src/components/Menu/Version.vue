<script lang="ts" setup>
import { VITE_VERSION_SHORT } from '@/composables/useHelper'
</script>

<template>
  <div class="flex flex-col gap-3 text-[13px]">
    <div class="flex items-center justify-between">
      <span class="bh-muted">当前版本</span>
      <span class="bh-chip">v{{ VITE_VERSION_SHORT }}</span>
    </div>

    <div class="bh-soft p-3 flex flex-col gap-2">
      <div class="flex items-center justify-between gap-3">
        <span class="bh-muted shrink-0">二次开发</span>
        <a class="bh-link" href="https://github.com/a78eng/boss-plug-in" target="_blank">
          Eng
        </a>
      </div>
      <div class="flex items-center justify-between gap-3">
        <span class="bh-muted shrink-0">原作者</span>
        <a class="bh-link" href="https://github.com/Ocyss" target="_blank">Ocyss_04</a>
      </div>
    </div>

    <p class="bh-muted text-[12px] leading-5">
      本项目基于原作者的开源版本二次开发，保留原有开源许可；使用中遇到问题请到二次开发仓库反馈。
    </p>
  </div>
</template>
