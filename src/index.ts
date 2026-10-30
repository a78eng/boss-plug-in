import ui from '@nuxt/ui/vue-plugin'
import { createApp } from 'vue'

import App from './App.vue'
import AppMenu from './AppMenu.vue'
import type { HelperContext } from './composables/useHelper'
import { HelperKey } from './composables/useHelper'

import AppStyle from '@/assets/main.css?inline'

type CustomElementCtor = CustomElementConstructor

function defineOnce(tag: string, ctor: CustomElementCtor) {
  // 重复注入(刷新/HMR/多次执行)时 define 会抛错, 直接导致整个插件不加载
  if (!customElements.get(tag)) {
    customElements.define(tag, ctor)
  }
}

export async function run<C extends HelperContext<C, T, S>, T, S>(ctx: HelperContext<C, T, S>) {
  function _connectedCallback(root: HTMLElement, App: any) {
    // 一个 host 只挂载一次, 避免重复渲染
    if ((root as any)._vueApp) {
      return
    }
    // 节点可能被 boss 移除后重新插入, shadowRoot 已存在时不能重复 attach
    const shadow = root.shadowRoot ?? root.attachShadow({ mode: 'open' })
    let container = shadow.querySelector<HTMLElement>('#app-root')
    if (!container) {
      const style = document.createElement('style')
      style.innerText = AppStyle
      shadow.appendChild(style)

      container = document.createElement('div')
      container.id = 'app-root'
      shadow.appendChild(container)
    }

    const app = createApp(App)
    app.use(ui)
    app.provide(HelperKey, ctx as never)
    app.mount(container)

    ;(root as any)._vueApp = app
  }

  defineOnce(
    'boss-helper-job',
    class extends HTMLElement {
      connectedCallback() {
        _connectedCallback(this, App)
      }
      disconnectedCallback() {
        // 完美卸载的关键：清理 Vue 实例
        const app = (this as any)._vueApp
        if (app) {
          app.unmount()
          ;(this as any)._vueApp = null
        }
      }
    },
  )

  defineOnce(
    'boss-helper-menu',
    class extends HTMLElement {
      connectedCallback() {
        _connectedCallback(this, AppMenu)
      }
      disconnectedCallback() {
        // 完美卸载的关键：清理 Vue 实例
        const app = (this as any)._vueApp
        if (app) {
          app.unmount()
          ;(this as any)._vueApp = null
        }
      }
    },
  )

  await ctx.onMount()
}
