<script lang="ts" setup>
import { computed, ref } from 'vue'

import type { BossCity, BossCityGroup } from '@/utils/bossCityData'
import { bossCityGroups } from '@/utils/bossCityData'
import { getBossCity } from '@/utils/city'

const value = defineModel<number[]>('value', { required: true })

const expanded = ref(false)
const keyword = ref('')

const selectedCities = computed<BossCity[]>(() =>
  (value.value ?? [])
    .map((code) => getBossCity(code))
    .filter((city): city is BossCity => Boolean(city)),
)

const selectedSet = computed(() => new Set(value.value ?? []))

const filteredGroups = computed<BossCityGroup[]>(() => {
  const kw = keyword.value.trim()
  if (!kw) {
    return bossCityGroups
  }
  const lower = kw.toLowerCase()
  const result: BossCityGroup[] = []
  for (const group of bossCityGroups) {
    const groupMatched = group.name.includes(kw)
    const cities = groupMatched
      ? group.cities
      : group.cities.filter(
          (city) =>
            city.name.includes(kw) ||
            city.pinyin.includes(lower) ||
            String(city.code).includes(kw),
        )
    if (cities.length) {
      result.push({ name: group.name, cities })
    }
  }
  return result
})

const filteredCities = computed(() => filteredGroups.value.flatMap((group) => group.cities))

const allFilteredSelected = computed(
  () =>
    filteredCities.value.length > 0 &&
    filteredCities.value.every((city) => selectedSet.value.has(city.code)),
)

function isGroupSelected(group: BossCityGroup) {
  return group.cities.length > 0 && group.cities.every((city) => selectedSet.value.has(city.code))
}

function toggle(code: number) {
  const current = value.value ?? []
  value.value = current.includes(code)
    ? current.filter((item) => item !== code)
    : [...current, code]
}

function toggleGroup(group: BossCityGroup) {
  const codes = group.cities.map((city) => city.code)
  if (isGroupSelected(group)) {
    value.value = (value.value ?? []).filter((code) => !codes.includes(code))
  } else {
    value.value = [...new Set([...(value.value ?? []), ...codes])]
  }
}

function toggleAllFiltered() {
  const codes = filteredCities.value.map((city) => city.code)
  if (allFilteredSelected.value) {
    value.value = (value.value ?? []).filter((code) => !codes.includes(code))
  } else {
    value.value = [...new Set([...(value.value ?? []), ...codes])]
  }
}
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full">
    <!-- 已选城市 -->
    <div class="flex flex-wrap gap-1 items-center min-h-8">
      <span
        v-for="city in selectedCities"
        :key="city.code"
        class="bh-pill bh-pill-active inline-flex gap-1 items-center"
        :title="`${city.name}（${city.code}）`"
      >
        {{ city.name }}
        <button
          type="button"
          class="cursor-pointer opacity-70 hover:opacity-100"
          :title="`移除 ${city.name}`"
          @click="toggle(city.code)"
        >
          <UIcon name="i-lucide-x" class="size-3" />
        </button>
      </span>
      <span v-if="!selectedCities.length" class="bh-muted text-xs">未选择城市</span>
    </div>

    <!-- 操作栏 -->
    <div class="flex flex-wrap gap-2 items-center">
      <UButton
        size="xs"
        color="primary"
        variant="soft"
        :icon="expanded ? 'i-lucide-chevron-up' : 'i-lucide-map-pin'"
        @click="expanded = !expanded"
      >
        {{ expanded ? '收起城市列表' : '选择城市' }}
      </UButton>
      <span class="bh-muted text-xs">已选 {{ selectedCities.length }} 个城市</span>
      <UButton
        v-if="selectedCities.length"
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-eraser"
        @click="value = []"
      >
        清空
      </UButton>
    </div>

    <!-- 城市列表 -->
    <div v-if="expanded" class="bh-glass flex flex-col gap-2 p-2">
      <div class="flex flex-wrap gap-2 items-center">
        <UInput
          v-model="keyword"
          size="sm"
          icon="i-lucide-search"
          placeholder="搜索城市、拼音或编号"
          class="flex-1 min-w-40"
        />
        <UButton size="xs" color="neutral" variant="soft" @click="toggleAllFiltered">
          {{ allFilteredSelected ? '取消全选' : '全选结果' }}
        </UButton>
      </div>

      <div class="flex flex-col gap-1.5 max-h-56 overflow-auto pr-1">
        <div
          v-for="group in filteredGroups"
          :key="group.name"
          class="flex flex-row gap-1.5 items-start"
        >
          <button
            type="button"
            class="w-16 shrink-0 pt-1 text-[11px] text-left cursor-pointer transition-colors hover:text-[color:var(--color-bh-accent)]"
            :class="
              isGroupSelected(group)
                ? 'text-[color:var(--color-bh-accent)] font-medium'
                : 'bh-muted'
            "
            :title="`切换整个 ${group.name}`"
            @click="toggleGroup(group)"
          >
            {{ group.name }}
          </button>
          <div class="flex flex-wrap flex-1 gap-1">
            <button
              v-for="city in group.cities"
              :key="city.code"
              type="button"
              class="bh-pill"
              :class="selectedSet.has(city.code) ? 'bh-pill-active' : ''"
              :title="`${city.name}（${city.code}）`"
              @click="toggle(city.code)"
            >
              {{ city.name }}
            </button>
          </div>
        </div>
        <div v-if="!filteredGroups.length" class="py-2 text-xs text-center bh-muted">
          没有匹配的城市
        </div>
      </div>
    </div>
  </div>
</template>
