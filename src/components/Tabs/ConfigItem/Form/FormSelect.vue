<script lang="ts" setup>
const value = defineModel<string[]>('value', { required: true })
// const options = defineModel<string[]>('options', { required: true })

const delimiter = /,|\s|\||，/
</script>

<template>
  <div class="flex flex-col gap-1">
    <UInputTags
      v-model="value"
      placeholder=""
      :delimiter="delimiter"
      addOnTab
      addOnBlur
      :duplicate="false"
    />
    <div v-if="value.length" class="flex justify-end">
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-eraser"
        data-help="清空当前关键词"
        @click="value = []"
      >
        清空
      </UButton>
    </div>
  </div>
</template>
