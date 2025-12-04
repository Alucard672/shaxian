// 教程步骤
export interface TutorialStep {
  id: string
  title: string
  description: string
  details: string[] // 详细步骤说明
}

// 教程流程
export interface TutorialFlow {
  id: string
  name: string
  description: string
  steps: TutorialStep[]
}

// 教程模块
export interface TutorialModule {
  id: string
  name: string
  icon: string
  description: string
  flows: TutorialFlow[]
}


