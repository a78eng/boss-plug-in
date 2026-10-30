import type { Ref } from 'vue'
import { ref, toValue } from 'vue'

import { logger } from '@/utils/logger'

const rootVue = ref()

/** 依次尝试这些容器, 兼容 boss 新旧几套页面结构 */
const ROOT_VUE_SELECTORS = [
  '#wrap',
  '.page-job-wrapper',
  '.job-recommend-main',
  '.page-jobs-main',
  '.job-search-wrapper',
  '#app',
]

/**
 * 获取 boss 的 vue 根实例, 找不到时返回 undefined 而不是抛错,
 * 避免整个插件因为拿不到 vue 实例而白屏
 */
export async function getRootVue(timeout = 12000): Promise<any> {
  if (rootVue.value !== undefined) {
    return rootVue.value
  }

  const waitVueMount = async () => {
    return new Promise<any>((resolve) => {
      const find = () => {
        if (rootVue.value !== undefined) {
          return rootVue.value
        }
        for (const selector of ROOT_VUE_SELECTORS) {
          const el = document.querySelector<any>(selector)
          if (el && '__vue__' in el && el.__vue__) {
            rootVue.value = el.__vue__
            return rootVue.value
          }
        }
        // 兜底: 页面上任意一个带 __vue__ 的元素
        const anyEl = document.querySelector<any>('[data-v-app], body > div')
        if (anyEl && '__vue__' in anyEl && anyEl.__vue__) {
          rootVue.value = anyEl.__vue__
          return rootVue.value
        }
        return undefined
      }

      const found = find()
      if (found) {
        return resolve(found)
      }

      const started = Date.now()
      const interval = setInterval(() => {
        const vue = find()
        if (vue) {
          clearInterval(interval)
          resolve(vue)
          return
        }
        if (Date.now() - started > timeout) {
          clearInterval(interval)
          logger.warn('未找到 boss 的 vue 根实例, 部分功能可能不可用')
          resolve(undefined)
        }
      }, 200)
    })
  }

  await waitVueMount()
  return rootVue.value
}

export function useHookVueData<T = any>(
  selectors: string,
  key: string,
  data: Ref<T>,
  update?: (val: T) => void,
) {
  return async () => {
    const jobVue = await new Promise<any>((resolve, reject) => {
      const interval = setInterval(() => {
        const jobVue = document.querySelector<any>(selectors)?.__vue__
        if (jobVue) {
          resolve(jobVue)
          clearInterval(interval)
        }
      }, 100)
      setTimeout(() => {
        reject(new Error('未找到对应元素'))
        clearInterval(interval)
      }, 20000)
    })

    data.value = jobVue[key]
    update?.(toValue(jobVue[key] as T))
    // eslint-disable-next-line no-restricted-properties
    const originalSet = jobVue.__lookupSetter__(key)
    // eslint-disable-next-line accessor-pairs
    Object.defineProperty(jobVue, key, {
      set(val: T) {
        data.value = val
        update?.(val)
        originalSet.call(this, val)
      },
    })
  }
}

export function useHookVueFn(selectors: string, key: string | string[]) {
  return async () => {
    const jobVue = await new Promise<any>((resolve, reject) => {
      const interval = setInterval(() => {
        const jobVue = document.querySelector<any>(selectors)?.__vue__
        if (jobVue) {
          resolve(jobVue)
          clearInterval(interval)
        }
      }, 100)
      setTimeout(() => {
        reject(new Error('未找到对应元素'))
        clearInterval(interval)
      }, 20000)
    })
    if (Array.isArray(key)) {
      for (const k of key) {
        if (jobVue[k]) {
          return jobVue[k]
        }
      }
    } else {
      return jobVue[key]
    }
  }
}
