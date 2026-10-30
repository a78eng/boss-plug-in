import { ref } from 'vue'

import { defineUnlistedScript } from '#imports'
import { appearanceConf, useConf } from '@/composables/conf'
import type { WorkflowData } from '@/composables/useApplying/type'
import { createLazyObject, isInitialized } from '@/composables/useApplying/type'
import type { JobData } from '@/composables/useHelper'
import { HelperContext } from '@/composables/useHelper'
import type { AlertItem, ConfigAccordionItem } from '@/composables/useHelper/type'
import { getRootVue, useHookVueData, useHookVueFn } from '@/composables/useVue'
import { run } from '@/index'
import { counter, initCounter } from '@/message'
import type { FormDataInput } from '@/types/formData'
import elmGetter from '@/utils/elmGetter'
import { logger } from '@/utils/logger'

import { GeekChatClientManager } from './chat'
import type { BoosJobData } from './delivery'
import { bossWorkflow } from './delivery'
import { uploadImage } from './requests'
import type { BossZpDetailData, BossZpJobItemData } from './types'

function removeAd() {
  // 统一带上超时, 否则元素不存在时会一直挂着 MutationObserver, 页面越用越卡
  const timeout = 8000
  // 新职位发布时通知我
  void elmGetter.rm('.job-list-wrapper .subscribe-weixin-wrapper', timeout)
  // 侧栏
  void elmGetter.rm('.job-side-wrapper', timeout)
  // 侧边悬浮框
  void elmGetter.rm('.side-bar-box', timeout)
  // 搜索栏登录框
  void elmGetter.rm('.go-login-btn', timeout)
  // 底部页脚
  // elmGetter.rm("#footer-wrapper");

  // 新版: 微信扫码
  void elmGetter.rm('.c-subscribe-weixin', timeout)
  // 新版: 求职工具
  void elmGetter.rm('.c-job-tools.job-tools', timeout)
  // 新版: 热门职位
  void elmGetter.rm('.c-hot-link.hot-link', timeout)
  // 新版: 面包屑
  void elmGetter.rm('.c-breadcrumb', timeout)
  // 新版: 职位详情页的引导(想要什么工作)
  void elmGetter.rm('.job-detail-container .job-detail-guide-cont', timeout)
}

const initChange = useHookVueFn('#wrap .page-job-wrapper', 'pageChangeAction')
const initSearch = useHookVueFn('#wrap .page-job-wrapper,.job-recommend-main,.page-jobs-main', [
  'searchJobAction',
  'onSearch',
])

function formatActiveTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const day = 24 * 60 * 60 * 1000

  if (diff < day) return '今日活跃'
  if (diff < 2 * day) return '昨日活跃'
  if (diff < 7 * day) return '本周活跃'
  if (diff < 30 * day) return '本月活跃'
  return '较久未活跃'
}

function convertBossZpJobItemToJobData(item: BossZpJobItemData): JobData {
  const key = `boss::${item.encryptJobId}`

  return {
    key,
    link: `https://www.zhipin.com/job_detail/${item.encryptJobId}.html`,
    jobName: item.jobName,
    positionName: item.jobName,
    jobDescription: '',

    // 经验和学历要求 - 从 jobLabels 中解析或直接使用
    experienceName: item.jobExperience || item.jobLabels?.[0] || '经验不限',
    degreeName: item.jobDegree || '学历不限',
    salary: item.salaryDesc,

    // 地址相关
    city: item.cityName,
    cityCode: Number(item.city) || undefined,
    address: [item.cityName, item.areaDistrict, item.businessDistrict].filter(Boolean).join('-'),
    addressCoords: item.gps ? [item.gps.longitude, item.gps.latitude] : undefined,

    // 技能标签
    showSkills: item.skills || [],
    jobLabels: item.jobLabels || [],
    skills: item.skills || [],

    // 活跃时间 - 从 lastModifyTime 获取
    activeTime: item.lastModifyTime,
    activeTimeStr: item.lastModifyTime ? formatActiveTime(item.lastModifyTime) : undefined,

    // 福利
    welfareList: item.welfareList,

    // 招聘者信息
    boss: {
      link: `https://www.zhipin.com/boss_detail/${item.encryptBossId}.html`,
      name: item.bossName,
      title: item.bossTitle,
      avatar: item.bossAvatar,
      certificated: item.bossCert > 0,
      isHeadhunter: item.goldHunter === 1,
      isFriend: false,
      isOnline: item.bossOnline ?? false,
    },

    // 公司品牌信息
    brand: {
      link: `https://www.zhipin.com/gongsi/${item.encryptBrandId}.html`,
      name: item.brandName,
      logo: item.brandLogo,
      scale: item.brandScaleName,
      industry: item.brandIndustry,
      stageName: item.brandStageName,
      introduce: '',
      labels: [],
    },

    // 状态信息
    // status: {
    //   status: item.contact ? 'warn' : 'pending',
    //   msg: item.contact ? '已沟通' : '未开始',
    // },
  }
}

export class BossHelperCtx extends HelperContext<BossHelperCtx, BoosJobData, {}> {
  private static instance: HTMLElement | null = null
  label = 'Boss直聘'
  key = 'boss'

  geek!: GeekChatClientManager

  _page = ref({ page: 1, pageSize: 15 })
  _pageHasMore = ref(true)
  _jobDetail = ref<BossZpDetailData>()
  _mountedPath: string | null = null
  _pageChange = (_v: number) => {
    throw new Error('pageChange is undefined')
  }
  _clickJobCardAction = (_: BossZpJobItemData) => {}
  _jobList: Ref<BossZpJobItemData[]>
  _jobDataMap: Map<string, BoosJobData>

  rootVue: any = null
  jobMaps: Map<string, WorkflowData<BoosJobData, {}>>
  jobList: Ref<JobData[]>

  constructor() {
    const jobList = ref<JobData[]>([])
    const _jobList = ref<BossZpJobItemData[]>([])
    const _jobListMap = new Map<string, BoosJobData>()

    super()

    this.jobList = jobList
    this._jobList = _jobList
    this._jobDataMap = _jobListMap

    this.jobMaps = reactive(new Map())
  }

  get uid() {
    // return window?.Cookie.get('bst') // token ?
    if (!window._PAGE.encryptUserId) {
      useToast().add({
        color: 'error',
        title: '未获取到用户ID，可能会出现奇怪bug, 请尝试刷新页面或反馈',
      })
    }
    return window._PAGE.encryptUserId
  }

  get userInfo() {
    return {
      id: window._PAGE.encryptUserId,
      name: window._PAGE.showName ?? window._PAGE.name,
      avatar: window._PAGE.largeAvatar ?? window._PAGE.tinyAvatar ?? '',
    }
  }

  static create() {
    // 同步创建, 让 UI 可以立刻挂载, 不必等待 boss 的 vue 实例
    return new BossHelperCtx()
  }

  /** 后台等待 boss 的 vue 根实例并接管路由, 失败不影响插件基本功能 */
  async bindRouter() {
    try {
      const vue = await getRootVue()
      this.rootVue = vue ?? null
      if (!vue?.$router?.afterHooks) {
        logger.warn('未接管路由, 切换页面后可能需要刷新')
        return
      }
      vue.$router.afterHooks.push((to: { path: string }) => {
        void this.onMount(to.path)
      })
    } catch (e) {
      logger.error('接管路由失败', e)
    }
  }

  async loadMoreJob(delayPromise: Promise<any>): Promise<boolean> {
    try {
      const oldLen = this._jobList.value.length
      const oldFirstJobId = this._jobList.value[0]?.encryptJobId ?? ''

      this._pageChange(this._page.value.page + 1)
      await delayPromise

      let currentFirstJobId = this._jobList.value[0]?.encryptJobId ?? ''
      let changed =
        oldLen !== this._jobList.value.length || oldFirstJobId !== currentFirstJobId

      // 有时候 boss 详情/列表懒加载较慢, 再多等一会, 避免直接判定"没有下一页"
      if (!changed) {
        const deadline = Date.now() + 20000
        while (Date.now() < deadline) {
          await new Promise((resolve) => setTimeout(resolve, 500))
          currentFirstJobId = this._jobList.value[0]?.encryptJobId ?? ''
          if (oldLen !== this._jobList.value.length || oldFirstJobId !== currentFirstJobId) {
            changed = true
            break
          }
        }
      }

      // 还没变化就再点一次翻页(有时点击被页面弹窗拦截)
      if (!changed) {
        logger.warn('翻页无变化, 重试一次')
        this._pageChange(this._page.value.page + 1)
        const deadline = Date.now() + 15000
        while (Date.now() < deadline) {
          await new Promise((resolve) => setTimeout(resolve, 500))
          currentFirstJobId = this._jobList.value[0]?.encryptJobId ?? ''
          if (oldLen !== this._jobList.value.length || oldFirstJobId !== currentFirstJobId) {
            changed = true
            break
          }
        }
      }

      if (!changed) {
        logger.error('翻页: 内容无变化')
        return false
      }
      return true
    } catch (err) {
      logger.error('翻页: 下一页错误', err)
      return false
    }
  }

  async start() {
    if (this.workflowRunning.value) {
      return
    }
    if (!this.workflow) {
      this.workflow = await bossWorkflow(this)
    }
    await this.workflow.executeAll(this._jobDataMap)
  }

  async sendMessage(data: WorkflowData<BoosJobData, {}>, msgs: FormDataInput['value']) {
    logger.debug('发送消息', { jobKey: data.jobData.key, msg: msgs })

    const stanza = {
      uid: Number(data.rawData.boss.data.bossId),
      friendSource: data.rawData.detail.bossInfo.bossSource ?? 0,
      encryptUid: data.rawData.jobitem.encryptBossId,
      encryptGid: '',
      clientMid: Date.now(),
    }
    if (typeof msgs === 'string') {
      msgs = [{ type: 'text', content: msgs }]
    }
    for (const msg of msgs) {
      var m
      // Each chat message needs its own client id; reusing one makes later messages look duplicated.
      stanza.clientMid = Date.now()
      if (msg.type === 'image') {
        const response = await counter.getImage(msg.image)
        if (!response.success) {
          throw new Error('图片未上传或已过期')
        }
        const u8Array = new Uint8Array(response.buffer)
        const file = new File([u8Array.buffer], response.name, { type: response.type })
        const img = await uploadImage(data.rawData.boss.data.securityId, file)

        m = this.geek.msgBuilder.createImageMessage(stanza, {
          content: {
            iid: 0,
            ...img,
          },
        })
      } else if (msg.type === 'text') {
        this.pendingMessages.value = msg.content
        await delay(this.conf.formData.delayMessageSending)
        m = this.geek.msgBuilder.createTextMessage(stanza, {
          text: this.pendingMessages.value,
        })
        this.pendingMessages.value = undefined
      } else {
        throw new Error('不支持的消息类型:' + msg['type'])
      }
      this.geek.client.publish('chat', this.geek.msgBuilder.encode(m), {
        qos: 1,
        retain: true,
      })
    }
  }

  private static mountTask: Promise<void> | null = null

  async onMount(path?: string) {
    // 并发保护: 初始化与路由回调可能同时触发, 之前会挂出两个界面
    if (BossHelperCtx.mountTask) {
      return BossHelperCtx.mountTask
    }
    BossHelperCtx.mountTask = this.doMount(path).finally(() => {
      BossHelperCtx.mountTask = null
    })
    return BossHelperCtx.mountTask
  }

  private async doMount(path?: string) {
    if (!path) {
      path = this.rootVue?.$route?.path ?? location.pathname
    }

    // 同一页面重复触发直接跳过; 页面切换后旧的节点会随 boss 重渲染一起被移除
    const existing = document.querySelector<HTMLElement>('boss-helper-job')
    if (existing?.isConnected && this._mountedPath === path) {
      return
    }

    // 保险起见把残留的界面节点全部清掉, 避免出现两个插件
    document.querySelectorAll<HTMLElement>('boss-helper-job').forEach((el) => el.remove())
    BossHelperCtx.instance = null
    // TODO: 移除menu, 可能导致nuxtui实例冲突
    // if (!document.querySelector('boss-helper-menu')) {
    //   const menuElement = document.createElement('boss-helper-menu')
    //   document.body.appendChild(menuElement)
    // }
    const elm = await elmGetter.get<HTMLElement>(
      '.job-search-wrapper,.job-recommend-main,.page-jobs .page-jobs-main',
      10000,
    )
    if (!elm) {
      logger.warn('当前页面未找到职位列表容器, 暂不注入界面')
      return
    }

    // 先把界面挂上去, 再慢慢初始化数据, 避免白屏等待
    const appElement = document.createElement('boss-helper-job')
    BossHelperCtx.instance = appElement
    this._mountedPath = path
    elm.insertBefore(appElement, elm.firstChild)
    removeAd()

    const initializers: Array<[string, () => Promise<void>]> = [
      ['分页信息', () => this._initPage()],
      ['翻页方法', () => this._initPageChange()],
      ['岗位详情', () => this._initJobDetail()],
      ['岗位卡片点击', () => this._initClickJobCardAction()],
      ['岗位列表', () => this._initJobList()],
    ]
    for (const [name, init] of initializers) {
      try {
        await init()
      } catch (e) {
        logger.error(`初始化${name}失败`, e)
      }
    }

    this.initNetConf()
    const contentElm = elm.querySelector<HTMLDivElement>('.recommend-result-inner')
    if (!this.geek) {
      this.geek = new GeekChatClientManager()
      void this.geek.connect().catch((e) => logger.error('聊天服务连接失败', e))
    }

    watch(
      appearanceConf.value,
      (v) => {
        if (!contentElm) return
        contentElm.style.marginRight =
          v.leftChat && v.contentOffset != 25 ? `${v.contentOffset}%` : 'auto'
        contentElm.style.marginLeft =
          !v.leftChat && v.contentOffset != 25 ? `${v.contentOffset}%` : 'auto'
      },
      { immediate: true },
    )
  }
  getConfigItems() {
    const conf = useConf()
    return computed<[AlertItem[], (ConfigAccordionItem | false)[]]>(() => {
      return [
        [
          {
            type: 'alert',
            id: 'config-alert-1',
            showIcon: true,
            title: '勾选后才生效，修改后记得保存',
            color: 'info',
            description: '配置项均有说明，鼠标悬停可查看；岗位滚动约 150 条后会自动停止。',
          },
        ],
        [
          {
            label: '筛选配置',
            value: 'filter',
            items: [
              {
                type: 'alert',
                id: 'filter-config-alert-enable',
                title: '包含与排除可点击切换',
                description: '混合模式无法兼顾，故不提供。',
                color: 'info',
                showIcon: true,
              },
              {
                type: 'div',
                class: 'grid grid-cols-2 gap-2 mt-2 w-full',

                items: [
                  {
                    type: 'select',
                    key: 'company',
                  },
                  {
                    type: 'select',
                    key: 'jobTitle',
                  },
                  {
                    type: 'select',
                    key: 'jobContent',
                  },
                  {
                    type: 'select',
                    key: 'hrPosition',
                  },
                  conf.configLevel.intermediate && {
                    type: 'city',
                    key: 'jobAddress',
                  },
                ],
              },
              {
                type: 'div',
                class: 'flex gap-2 mt-3',
                items: [
                  conf.configLevel.intermediate && {
                    type: 'salaryRange',
                    key: 'salaryRange',
                  },
                  conf.configLevel.intermediate && {
                    type: 'companySizeRange',
                    key: 'companySizeRange',
                  },
                ],
              },
              {
                type: 'div',
                class: 'col-span-full flex flex-wrap gap-2 mt-3',
                items: [
                  conf.configLevel.intermediate && {
                    type: 'activityRange',
                    key: 'activityFilter',
                  },
                  {
                    type: 'checkbox',
                    key: 'goldHunterFilter',
                  },
                  {
                    type: 'checkbox',
                    key: 'friendStatus',
                  },
                  {
                    type: 'checkbox',
                    key: 'bossGoldMedalHr',
                  },
                  conf.configLevel.intermediate && {
                    type: 'checkbox-expire',
                    key: 'sameCompanyFilter',
                  },
                  conf.configLevel.intermediate && {
                    type: 'checkbox-expire',
                    key: 'sameHrFilter',
                  },
                ],
              },
            ],
          },
          conf.configLevel.intermediate && {
            label: '招呼语配置',
            value: 'greetings',
            items: [
              {
                type: 'alert',
                id: 'config-alert-2',
                showIcon: true,
                color: 'info',
                description: '使用自定义招呼语前，建议先关闭 Boss 自带招呼语。',
                actions: [
                  {
                    label: '前往',
                    color: 'neutral',
                    variant: 'subtle',
                    onClick: () => {
                      window.open(
                        'https://www.zhipin.com/web/geek/notify-set?type=greetSet',
                        '_blank',
                      )
                    },
                  },
                ],
              },
              { type: 'customGreeting', key: 'customGreeting' },
            ],
          },
          {
            label: '外观配置',
            value: 'appearance',
            items: [{ type: 'appearance', key: 'appearance' }],
          },
          conf.configLevel.advanced && {
            label: '地址配置',
            value: 'address',
            items: [{ type: 'address', key: 'address' }],
          },
          conf.configLevel.intermediate && {
            label: '延迟配置',
            value: 'delay',
            items: [
              {
                type: 'div',
                class: 'grid grid-cols-2 gap-3',
                items: [
                  {
                    type: 'inputNumber',
                    key: 'delayDeliveryStarts',
                    fieldProps: {
                      label: '投递开始',
                      'data-help': '点击开始后等待的时间，默认 3 秒。',
                    },
                    inputNumberProps: {
                      min: 1,
                      max: 99999,
                    },
                  },
                  {
                    type: 'inputNumber',
                    key: 'delayDeliveryInterval',
                    fieldProps: {
                      label: '投递间隔',
                      'data-help': '两次投递之间的间隔，过快易触发风控，默认 5 秒。',
                    },
                    inputNumberProps: {
                      min: 1,
                      max: 99999,
                    },
                  },
                  {
                    type: 'inputNumber',
                    key: 'delayDeliveryPageNext',
                    fieldProps: {
                      label: '投递翻页',
                      'data-help': '翻页前的等待时间，过快易触发风控，默认 60 秒。',
                    },
                    inputNumberProps: {
                      min: 1,
                      max: 99999,
                    },
                  },
                  {
                    type: 'inputNumber',
                    key: 'delayMessageSending',
                    fieldProps: {
                      label: '消息发送',
                      'data-help': '发送消息前的等待时间，便于手动修改。',
                    },
                    inputNumberProps: {
                      min: 1,
                      max: 99999,
                      disable: true,
                    },
                  },
                ],
              },
            ],
          },
        ],
      ]
    })
  }
  override async onJobCardClick(key: string) {
    // const detail = await requestDetail({
    //   securityId: job.rawData.jobitem.securityId,
    //   lid: job.rawData.jobitem.encryptJobId,
    // }).then((r) => r.zpData)
    const job = this.jobMaps.get(key)
    if (!job) {
      throw new Error('未找到job数据')
    }
    if (isInitialized(job.rawData.detail)) {
      return
    }
    const waitDetail = (ms: number) =>
      new Promise<BossZpDetailData>((resolve, reject) => {
        const timer = setTimeout(() => {
          clearInterval(interval)
          reject(new Error('bossZpDetailData获取超时'))
        }, ms)
        const interval = setInterval(() => {
          const detail = this._jobDetail.value
          if (detail && detail.lid === job.rawData.jobitem.lid) {
            clearInterval(interval)
            clearTimeout(timer)
            resolve(detail)
          }
        }, 100)
      })

    const clickAndWait = async () => {
      this._clickJobCardAction(job.rawData.jobitem)
      return waitDetail(20000)
    }

    // 偶发点击被页面弹窗/懒加载吞掉, 失败后重试一次, 避免每个岗位卡 60s
    let detail: BossZpDetailData
    try {
      detail = await clickAndWait()
    } catch {
      detail = await clickAndWait()
    }

    job.rawData.detail = detail
    const targetJob = job.jobData
    targetJob.activeTime = detail.brandComInfo.activeTime
    targetJob.activeTimeStr = detail.bossInfo.activeTimeDesc
    targetJob.jobDescription = detail.jobInfo.postDescription
    targetJob.city = detail.jobInfo.locationName
    targetJob.address = detail.jobInfo.address
    targetJob.addressCoords = [detail.jobInfo.longitude, detail.jobInfo.latitude]

    targetJob.boss = {
      ...targetJob.boss,
      isOnline: detail.bossInfo.bossOnline,
      isCertificated: detail.bossInfo.certificated,
    }

    targetJob.brand = {
      ...targetJob.brand,
      labels: detail.brandComInfo.labels,
      introduce: detail.brandComInfo.introduce,
      stageName: detail.brandComInfo.stageName,
    }
    this.jobMaps.set(key, job)
  }
  async _initJobList() {
    await useHookVueData(
      '#wrap .page-job-wrapper,.job-recommend-main,.page-jobs-main',
      'jobList',
      this._jobList,
      (v) => {
        this.jobList.value = v.map((item) => {
          // const jobData = convertBossZpJobItemToJobData(item)
          // if (this.conf.formData.useCache.value) {
          //   const cacheCheck = checkJobCache(jobData.key)
          //   if (cacheCheck) {
          //     jobData.status = {
          //       status: cacheCheck.status,
          //       msg: `${cacheCheck.message} (缓存)`,
          //     }
          //   }
          // }
          const job = convertBossZpJobItemToJobData(item)

          let jobData = this._jobDataMap.get(job.key)
          if (jobData) {
            jobData = {
              ...jobData,
              jobitem: item,
            }
          } else {
            jobData = {
              jobitem: item,
              detail: createLazyObject('岗位详情获取'),
              boss: createLazyObject('Boss信息获取'),
            }
          }
          this._jobDataMap.set(job.key, jobData)

          return job
        })
        this.jobList.value.forEach((job) => {
          this.jobMaps.set(job.key, {
            jobData: job,
            rawData: this._jobDataMap.get(job.key)!,
            state: {},
          })
        })
      },
    )()
  }

  async _initPage() {
    await useHookVueData(
      '#wrap .page-job-wrapper,.job-recommend-main,.page-jobs-main',
      'pageVo',
      this._page,
    )()
    await useHookVueData(
      '#wrap .page-job-wrapper,.job-recommend-main,.page-jobs-main',
      'hasMore',
      this._pageHasMore,
    )()
  }

  async _initJobDetail() {
    await useHookVueData(
      '#wrap .page-job-wrapper,.job-recommend-main,.page-jobs-main',
      'jobDetail',
      this._jobDetail,
    )()
  }

  async _initPageChange() {
    let pc =
      location.href.includes('/web/geek/job-recommend') || location.href.includes('/web/geek/jobs')
        ? await initSearch()
        : await initChange()
    if (!pc) {
      throw new Error('pageChange is undefined')
    }
    this._pageChange = pc
  }

  async _initClickJobCardAction() {
    this._clickJobCardAction = await useHookVueFn(
      '#wrap .page-job-wrapper,.job-recommend-main,.page-jobs-main',
      'clickJobCardAction',
    )()
  }
}

// function shouldCaptureChatSocket(url: string | URL | undefined) {
//   return url != null && url.toString().includes('chatws')
// }

// function hookChatSocket() {
//   const NativeWebSocket = window.WebSocket
//   const HOOK_SYMBOL = Symbol('__IS_HOOKED__')

//   if (!(NativeWebSocket as any)[HOOK_SYMBOL]) {
//     window.WebSocket = new Proxy(NativeWebSocket, {
//       construct(target, args, newTarget) {
//         const socket = Reflect.construct(target, args, newTarget)

//         const [url] = args as [string | URL | undefined, string | string[] | undefined]

//         if (!shouldCaptureChatSocket(url)) {
//           return socket
//         }
//         BossHelperCtx.setSocket(socket)
//         socket.addEventListener('open', () => {
//           BossHelperCtx.setSocket(socket)
//         })
//         socket.addEventListener('close', () => {
//           BossHelperCtx.setSocket(null)
//         })

//         return socket
//       },
//     }) as typeof WebSocket

//     Object.defineProperty(window.WebSocket, HOOK_SYMBOL, {
//       value: true,
//       enumerable: false,
//       writable: false,
//       configurable: false,
//     })
//   }
// }

export default defineUnlistedScript(async () => {
  // hookChatSocket()

  initCounter()

  // 页面里可能被注入多次, 只允许第一份脚本运行, 避免出现两个插件
  const win = window as unknown as { __BOSS_PLUGIN_LOADED__?: boolean }
  if (win.__BOSS_PLUGIN_LOADED__) {
    return
  }
  win.__BOSS_PLUGIN_LOADED__ = true

  // 先创建实例并挂载界面, vue 根实例/路由接管放到后台, 避免"等 20 秒还没界面"
  const bossHelpCtx = BossHelperCtx.create()
  void bossHelpCtx.bindRouter()
  await run(bossHelpCtx)
})
