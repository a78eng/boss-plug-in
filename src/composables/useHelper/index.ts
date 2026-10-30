import type { InjectionKey } from 'vue'
import { inject } from 'vue'

import type { HelperContext } from './ctx'
export { HelperContext } from './ctx'
export type { JobBaseData, JobData, LogData, Log } from './type'

export const HelperKey = Symbol() as InjectionKey<HelperContext<any, unknown, unknown>>

export const VITE_VERSION = __APP_VERSION__
/** 展示用版本号, 例如 0.6.0 -> 0.6 */
export const VITE_VERSION_SHORT = VITE_VERSION.split('.').slice(0, 2).join('.')

export const useHelper = () => {
  const ctx = inject(HelperKey)
  if (!ctx) {
    throw new Error('useHelper must be used within a HelperProvider')
  }
  return ctx
}
