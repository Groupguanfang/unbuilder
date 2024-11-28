import type { DtsBuildOptions } from './types'
import * as compiler from '@vue/compiler-sfc'

export interface VueService {
  getVueCompiler: () => typeof import('@vue/compiler-sfc') | false
  isEnabled: boolean
}

export function useVue(options: DtsBuildOptions): VueService {
  return {
    getVueCompiler(): typeof import('@vue/compiler-sfc') | false {
      if (options.vue === false)
        return false
      if (options.vue && options.vue.compiler)
        return options.vue.compiler
      return compiler
    },

    isEnabled: !!options.vue,
  }
}
