import type { EsbuildBuilderConfig } from './types'
import path from 'node:path'
import PostCSS from '@chialab/esbuild-plugin-postcss'
import { build } from 'esbuild'
import EsBuildVue from 'unplugin-vue/esbuild'
import { PackageJsonEntry } from './analyzers/entry-analyzer'
import { PackageJsonExternal } from './analyzers/external-analyzer'

export function EsbuildVuePlugin(mixed: Parameters<typeof EsBuildVue>[0] = {}): ReturnType<typeof EsBuildVue> {
  return EsBuildVue({
    ...mixed,
  })
}

export function PostCSSPlugin(mixed: Parameters<typeof PostCSS>[0] = {}): ReturnType<typeof PostCSS> {
  return PostCSS({
    ...mixed,
  })
}

export async function buildWithEsbuild(config: EsbuildBuilderConfig): Promise<void> {
  const options = config.esbuildOptions || {}

  // 装载入口分析器
  if (config.entryExtractor !== false)
    options.entryPoints = PackageJsonEntry(
      typeof config.entryExtractor === 'string' ? config.entryExtractor : './src',
      config.builder,
    )

  // 默认开启bundle模式
  if (typeof options.bundle !== 'boolean')
    options.bundle = true
  // 默认开启treeShaking
  if (typeof options.treeShaking !== 'boolean')
    options.treeShaking = true
  if (!options.outdir)
    options.outdir = path.resolve('dist')
  // 装载外部依赖分析器
  if (options.bundle !== false && !options.external)
    options.external = PackageJsonExternal('deps-array', config.builder)
  if (!options.format)
    options.format = 'cjs'

  // Fix一下esbuild的插件配置
  if (!options.plugins)
    options.plugins = []

  // ------------------- Vue Files -------------------
  if (typeof config.vue !== 'boolean' && typeof config.vue !== 'object')
    config.vue = true
  if (config.vue !== false) {
    if (typeof config.vue === 'object')
      options.plugins.push(EsbuildVuePlugin(config.vue))
    else if (config.vue === true)
      options.plugins.push(EsbuildVuePlugin())
  }

  await build(options)
}
