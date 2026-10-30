import type { FormData } from '@/types/formData'

// TODO: 移除info, 忘记当初为啥要维护这一坨了, 还是直接写组件里面好看

export const formInfoData: Record<string, any> = {
  configLevel: {
    options: [
      {
        value: 'beginner',
        label: '新手',
      },
      {
        value: 'intermediate',
        label: '初学者',
      },
      {
        value: 'advanced',
        label: '中级',
      },
      {
        value: 'expert',
        label: '高级',
      },
    ],
    'data-help': '按级别展示不同数量的配置项，降低上手难度。',
  },
  company: {
    label: '公司名',
    'data-help': '按公司名模糊匹配，可只投或排除某公司。',
  },
  jobTitle: {
    label: '岗位名',
    'data-help': '按岗位名模糊匹配，可只投或排除某岗位。',
  },
  jobContent: {
    label: '工作内容',
    'data-help': '在岗位描述中匹配关键词，自动忽略“不是、无需”等否定语境。',
  },
  hrPosition: {
    label: 'Hr职位',
    'data-help': '按招聘者职位精确匹配，可只投给经理、主管等。',
  },
  jobAddress: {
    label: '工作城市',
    'data-help': '按 Boss 官方城市编号筛选，不依赖地址文本；包含为只投、排除为不投。',
  },
  customGreeting: {
    label: '自定义招呼语',
    'data-help': 'Boss 不支持修改默认招呼语，开启后会在默认招呼语之后再发一条。',
  },
  greetingVariable: {
    label: '招呼语变量',
    'data-help': '使用模板变量渲染招呼语内容。',
  },
  activityFilter: {
    label: '活跃度过滤',
    'data-help': '过滤长期未活跃的招聘者，时间范围与 Boss 一致。',
  },
  goldHunterFilter: {
    label: '猎头过滤',
    'data-help': '过滤猎头发布的职位。',
  },
  friendStatus: {
    label: '好友过滤',
    'data-help': '过滤已经建立聊天的招聘者。',
  },
  bossGoldMedalHr: {
    label: '过滤金牌面试官',
    'data-help': '过滤带金牌面试官头像框的招聘者。',
  },
  sameCompanyFilter: {
    label: '相同公司过滤',
    'data-help': '避免重复投递同一家公司。',
  },
  sameHrFilter: {
    label: '相同Hr过滤',
    'data-help': '避免重复投递同一位招聘者。',
  },
  aiGreeting: {
    label: 'AI招呼语',
    'data-help': '用 AI 生成打招呼内容，开启后不再发送普通招呼语。',
  },
  aiFiltering: {
    label: 'AI过滤',
    'data-help': '用 AI 对岗位评分，低于阈值的直接跳过。',
  },
  aiReply: {
    label: 'AI回复',
    'data-help': '用 AI 自动回复消息，暂未实现。',
  },
  record: {
    label: '内容记录',
    'data-help': '记录岗位与对话内容。',
  },
  amap: {
    enable: {
      label: '启用',
      'data-help': '启用高德地图，按距离或时间筛选岗位，需要自己的 Key。',
    },
    key: {
      label: '高德地图key',
      'data-help': '在高德开放平台申请 Web 服务 Key。',
    },
    origins: {
      label: '起点经纬度',
      'data-help': '经度与纬度以逗号分隔，也可填写地址后自动解析。',
    },
    straightDistance: {
      label: '直线距离',
      'data-help': '单位千米，为 0 时不限制。',
    },
    drivingDistance: {
      label: '驾车距离',
      'data-help': '单位千米，为 0 时不限制，会参考实时路况。',
    },
    drivingDuration: {
      label: '驾车时间',
      'data-help': '单位分钟，为 0 时不限制，会参考实时路况。',
    },
    walkingDistance: {
      label: '步行距离',
      'data-help': '单位千米，为 0 时不限制。',
    },
    walkingDuration: {
      label: '步行时间',
      'data-help': '单位分钟，为 0 时不限制。',
    },
  },
}

export const defaultFormData: FormData = {
  configLevel: 'beginner',
  company: {
    include: false,
    value: [],
    options: [],
    enable: false,
  },
  jobTitle: {
    include: true,
    value: [],
    options: [],
    enable: false,
  },
  jobContent: {
    include: false,
    value: [],
    options: [],
    enable: false,
  },
  hrPosition: {
    include: true,
    value: [],
    options: ['经理', '主管', '法人', '人力资源主管', 'hr', '招聘专员'],
    enable: false,
  },
  jobAddress: {
    value: [],
    enable: false,
    include: true,
  },
  salaryRange: {
    value: [8, 13, false],
    advancedValue: {
      // 默认全部关闭，避免用户未配置而投递错误岗位
      H: [0, 1, false],
      D: [0, 1, false],
      M: [0, 1, false],
    },
    enable: false,
  },
  companySizeRange: {
    value: [500, 2000, true],
    enable: false,
  },
  customGreeting: {
    value: '',
    enable: false,
  },
  deliveryLimit: {
    value: 120,
  },
  greetingVariable: {
    value: false,
  },
  activityFilter: {
    value: true,
    days: 7,
  },
  friendStatus: {
    value: true,
  },
  bossGoldMedalHr: {
    value: false,
  },
  sameCompanyFilter: {
    value: false,
    expire: 0,
  },
  sameHrFilter: {
    value: true,
    expire: 0,
  },
  goldHunterFilter: {
    value: false,
  },
  notification: {
    value: true,
  },
  useCache: {
    value: false,
  },
  aiGreeting: {
    enable: false,
    prompt: [
      {
        role: 'system',
        content: `## 角色
  求职小能手
  
  ## input：
  1 **求职者信息**
  \`\`\`
  1. ....
  2. ....
  3. ....
  \`\`\`
  
  ## outputformat
  招呼语字符串，无书信格式和前缀，和聊天开场白一样的介绍求职者`,
      },
      {
        role: 'user',
        content: `### 待处理的岗位信息:\`\`\`
  <岗位信息>
  岗位名:{{ jobData.jobName }}   薪资: {{ jobData.salary }}
  学历要求: {{ jobData.degreeName }}
  技能要求: {{ jobData.skills }}
  岗位标签:{{ jobData.jobLabels }}
    <岗位描述>
    {{ jobData.jobDescription }}
    <岗位描述/>
  </岗位信息>
  \`\`\``,
      },
    ],
  },
  aiFiltering: {
    enable: false,
    prompt: [
      {
        role: 'system',
        content: `## 角色
  求职评委
  
  最终返回下面格式的JSON字符串,不要有任何其他字符
  
  interface aiFilteringItem {
    reason: string; // 扣分或加分的理由
    score: number ; // 分数变化 正整数 不需要+-正负符号
  }
  
  interface aiFiltering {
    negative: aiFilteringItem[]; // 扣分项
    positive: aiFilteringItem[] ; // 加分项
  }
  
  ## 求职者需求
  - 加分: 双休,早九晚五,新技术,机会多,年轻人多 每个加分项 10分
  - 扣分: 需要上门,福利少,需要和客户交流,需要推销 每个扣分项 10分
  `,
      },
      {
        role: 'user',
        content: `## 待处理的岗位信息:
  <岗位信息>
  岗位名:{{ jobData.jobName }}   薪资: {{ jobData.salary }}
  学历要求: {{ jobData.degreeName }}    工作经验要求: {{ jobData.experienceName }}
  福利列表: {{ jobData.welfareList }}
  技能要求: {{ jobData.skills }}
  岗位标签:{{ jobData.jobLabels }}
    <岗位描述>
    {{ jobData.jobDescription }}
    <岗位描述/>
  </岗位信息>`,
      },
    ],
    score: 10,
  },
  aiReply: {
    enable: false,
    prompt: [{ role: 'user', content: '帮我写一个回复的提示' }],
  },
  amap: {
    key: '',
    origins: '',
    straightDistance: 0,
    drivingDistance: 0,
    drivingDuration: 0,
    walkingDistance: 0,
    walkingDuration: 0,
    enable: false,
  },
  record: {
    enable: false,
  },
  delayDeliveryStarts: 3,
  delayDeliveryInterval: 5,
  delayDeliveryPageNext: 60,
  delayMessageSending: 2,
  version: '20261030',
}
