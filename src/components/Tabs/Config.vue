<script lang="ts" setup>
import Alert from '@/components/Alert.vue'
import { formInfoData, useConf } from '@/composables/conf'
import { getCacheManager } from '@/composables/useApplying'
import { useHelper } from '@/composables/useHelper'

import ConfigItem from './ConfigItem/ConfigItem.vue'

const helper = useHelper()
const conf = useConf()
const configItems = helper.getConfigItems()
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <UTheme
      :ui="{
        formField: {
          root: 'flex max-sm:flex-col justify-between gap-3 items-center',
          container: 'flex-1',
        },
        input: { root: 'w-full' },
        inputMenu: { root: 'w-full' },
        inputTags: { root: 'w-full' },
      }"
    >
      <Alert v-for="(items, index) in configItems[0]" :key="index" v-bind="items" />

      <UForm :disabled="helper.workflowRunning.value || conf.isLoading.value">
        <UAccordion
          class="bh-glass px-2 py-0.5"
          type="single"
          collapsible
          :items="configItems[1].filter((item) => !!item)"
          :ui="{ content: 'data-[state=open]:pt-2 data-[state=open]:pb-3 px-1 gap-3' }"
          :unmount-on-hide="false"
          default-value="filter"
        >
          <template #body="{ item }">
            <template v-for="(v, i) in item.items" :key="i">
              <ConfigItem v-if="v" :item="v" />
            </template>
          </template>
        </UAccordion>
      </UForm>

      <div class="flex flex-wrap gap-x-4 gap-y-2 items-center pt-1">
        <UFormField label="配置级别" :data-help="formInfoData.configLevel['data-help']">
          <USelectMenu
            v-model="conf.formData.configLevel"
            :items="formInfoData.configLevel.options"
            value-key="value"
            label-key="label"
            :search-input="false"
            size="sm"
          />
        </UFormField>

        <UFormField label="投递数量" data-help="达到上限会自动暂停；Boss 上限为 150">
          <UInputNumber
            v-model="conf.formData.deliveryLimit.value"
            :min="1"
            :max="155"
            :step="10"
            size="sm"
            class="w-24"
          />
        </UFormField>

        <UCheckbox label="发送通知" v-model="conf.formData.notification.value" />

        <template v-if="conf.configLevel.expert || conf.formData.useCache.value">
          <UCheckbox
            label="启用缓存"
            v-model="conf.formData.useCache.value"
            data-help="缓存投递记录，减少重复投递；异常时可清空缓存"
          />
          <UButton color="warning" size="sm" variant="soft" @click="getCacheManager().clearCache()">
            清空缓存
          </UButton>
        </template>
      </div>

      <div class="border-t border-[color:var(--color-bh-line)] pt-2.5 flex flex-wrap gap-2 items-center">
        <UButton color="success" size="sm" data-help="保存当前全部配置" @click="conf.confSaving">
          保存配置
        </UButton>
        <UButton
          color="warning"
          size="sm"
          variant="soft"
          data-help="丢弃未保存修改，重新读取已保存的配置"
          @click="conf.confReload"
        >
          重载配置
        </UButton>
        <UButton
          color="primary"
          size="sm"
          variant="soft"
          data-help="填入推荐的延迟与过滤参数，不会覆盖主要筛选条件"
          @click="conf.confRecommend"
        >
          推荐配置
        </UButton>

        <div class="ml-auto flex flex-wrap gap-2 items-center">
          <UFormField label="预设" data-help="多套配置快速切换，便于多账号使用">
            <UInputMenu
              v-model="conf.formDataPreset.value"
              :items="conf.formDataPresets.value"
              value-key="value"
              create-item
              size="sm"
              class="w-32"
              @create="conf.createPreset"
              @update:model-value="(v) => conf.switchPreset(v)"
            />
          </UFormField>
          <UButton
            v-if="conf.configLevel.intermediate"
            color="neutral"
            size="sm"
            variant="soft"
            @click="conf.confExport"
          >
            导出
          </UButton>
          <UButton
            v-if="conf.configLevel.intermediate"
            color="neutral"
            size="sm"
            variant="soft"
            @click="conf.confImport"
          >
            导入
          </UButton>
          <UButton
            v-if="conf.configLevel.advanced"
            color="error"
            size="sm"
            variant="ghost"
            data-help="清空全部配置，可重载恢复"
            @click="conf.confDelete"
          >
            清空
          </UButton>
        </div>
      </div>
    </UTheme>
  </div>
</template>
