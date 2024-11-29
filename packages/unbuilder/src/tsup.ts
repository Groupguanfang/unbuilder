import type { TsupBuilderConfig } from './types'
import { build } from 'tsup'
import { PackageJsonEntry } from './analyzers'
import { EsbuildVuePlugin } from './esbuild'

export async function buildWithTsup(config: TsupBuilderConfig): Promise<void> {
  const options = config.tsupOptions || {}

  // 装载入口分析器
  if (config.entryExtractor !== false) {
    const analyzedEntry = PackageJsonEntry(
      typeof config.entryExtractor === 'string' ? config.entryExtractor : './src',
      config.builder,
    )
    if (!Array.isArray(options.entry) && typeof options.entry === 'string')
      options.entry = analyzedEntry
    else {
      options.entry = {
        ...analyzedEntry,
        ...options.entry,
      }
    }
  }

  if (
    typeof options.dts !== 'boolean'
    && typeof options.dts !== 'object'
    && typeof options.dts !== 'string'
    && config.vue !== false
  )
    options.dts = true

  // ------------------- Vue Files -------------------
  if (config.vue !== false) {
    // 因为tsup不支持生成.vue文件的dts文件，请用`bundle-dts-generator`代替
    options.dts = false
    if (!options.esbuildPlugins)
      options.esbuildPlugins = []
    options.esbuildPlugins.push(EsbuildVuePlugin(typeof config.vue === 'object' ? config.vue : {}))
  }
  // 默认生成esm和cjs格式
  if (!options.format)
    options.format = ['esm', 'cjs']

  return await build(options)
}
