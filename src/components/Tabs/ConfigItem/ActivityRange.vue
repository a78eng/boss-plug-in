<script lang="ts" setup>
import { formInfoData, useConf } from '@/composables/conf'

const conf = useConf()

const options = [
  { label: '今日活跃', value: 1 },
  { label: '3日内活跃', value: 3 },
  { label: '本周活跃', value: 7 },
  { label: '本月活跃', value: 30 },
]
</script>

<template>
  <span
    class="inline-flex gap-1 items-center"
    :title="formInfoData.activityFilter['data-help']"
  >
    <UCheckbox v-model="conf.formData.activityFilter.value" :label="formInfoData.activityFilter.label" />
    <USelectMenu
      v-model="conf.formData.activityFilter.days"
      :items="options"
      value-key="value"
      label-key="label"
      :search-input="false"
      size="xs"
      class="w-27"
      :disabled="!conf.formData.activityFilter.value"
    />
  </span>
</template>
