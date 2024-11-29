import type { LibraryFormats } from 'vite'
import type { ViteLibModeBuilderConfig } from './types'
import ViteVue from 'unplugin-vue/vite'
import { build } from 'vite'
import { AliasAnalyzer, OutputAnalyzer, PackageJsonEntry, PackageJsonExternal } from './analyzers'

export async function buildWithViteLibMode(config: ViteLibModeBuilderConfig): Promise<void> {
  const options = config.viteOptions || {}

  // 装载入口分析器
  if (config.entryExtractor !== false) {
    if (!options.build)
      options.build = {}
    const analyzedEntry = PackageJsonEntry(
      typeof config.entryExtractor === 'string' ? config.entryExtractor : './src',
      config.builder,
    )

    if (options.build.lib === false)
      return

    options.build.ssr = true
    options.build.lib = {
      entry: analyzedEntry,
      formats: OutputAnalyzer({}, config.builder).map(item => item.format) as LibraryFormats[],
      ...(options.build.lib || {}),
    }
  }

  // 装载外部依赖分析器
  if (!options.ssr)
    options.ssr = {}
  if (!options.ssr.external)
    options.ssr.external = PackageJsonExternal('deps-array', config.builder)
  if (!options.ssr.noExternal)
    options.ssr.noExternal = PackageJsonExternal('excludes', config.builder)

  // 装载别名分析器
  if (config.aliasExtractor !== false) {
    if (!options.resolve)
      options.resolve = {}
    options.resolve.alias = {
      ...AliasAnalyzer(config.builder),
      ...(options.resolve.alias || {}),
    }
  }

  // 装载vue插件
  if (config.vue !== false) {
    if (!options.plugins)
      options.plugins = []
    options.plugins.push(ViteVue(typeof config.vue === 'object' ? config.vue : {}) as any)
  }

  await build(options)
}
