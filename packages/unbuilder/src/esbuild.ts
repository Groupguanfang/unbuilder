import type { EsbuildBuilderConfig } from './types'
import { build } from 'esbuild'
import EsBuildVue from 'unplugin-vue/esbuild'
import { PackageJsonEntry } from './analyzers/entry-analyzer'
import { PackageJsonExternal } from './analyzers/external-analyzer'

export async function buildWithEsbuild(config: EsbuildBuilderConfig): Promise<void> {
  const options = config.esbuildOptions || {}

  // 装载入口分析器
  if (config.entryExtractor !== false)
    options.entryPoints = PackageJsonEntry(typeof config.entryExtractor === 'string' ? config.entryExtractor : './src')

  // 默认开启bundle模式
  if (typeof options.bundle !== 'boolean')
    options.bundle = true
  // 默认开启treeShaking
  if (typeof options.treeShaking !== 'boolean')
    options.treeShaking = true
  // 装载外部依赖分析器
  if (options.bundle !== false && !options.external)
    options.external = PackageJsonExternal('excludes')

  // Fix一下esbuild的插件配置
  if (!options.plugins)
    options.plugins = []

  // ------------------- Vue Files -------------------
  if (typeof config.vue !== 'boolean' && typeof config.vue !== 'object')
    config.vue = true
  if (config.vue !== false) {
    if (typeof config.vue === 'object')
      options.plugins.push(EsBuildVue(config.vue))
    else if (config.vue === true)
      options.plugins.push(EsBuildVue())
  }

  await build(options)
}
