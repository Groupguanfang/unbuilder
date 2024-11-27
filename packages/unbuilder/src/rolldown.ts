import type { RolldownBuilderConfig, RolldownOptions } from './types'
import { rolldown } from 'rolldown'
import PostCSS from 'rollup-plugin-postcss'
import RolldownVue from 'unplugin-vue/rolldown'
import { AliasAnalyzer, OutputAnalyzer, PackageJsonEntry, PackageJsonExternal } from './analyzers'
import FileInfo from './file-info'

function resolveRolldownConfig(config: RolldownBuilderConfig): RolldownOptions {
  const options = config.rolldownOptions || {}

  // 装载入口分析器
  if (config.entryExtractor !== false) {
    const analyzedEntry = PackageJsonEntry(
      typeof config.entryExtractor === 'string' ? config.entryExtractor : './src',
      config.builder,
    )
    if (!Array.isArray(options.input) && typeof options.input === 'string')
      options.input = analyzedEntry
    else {
      options.input = {
        ...analyzedEntry,
        ...options.input,
      }
    }
  }

  // 装载输出分析器
  if (config.outputExtractor !== false)
    options.output = OutputAnalyzer({}, config.builder)

  // 装载外部依赖分析器
  if (!options.external)
    options.external = PackageJsonExternal('deps', config.builder)

  // fix一下rolldown的插件配置
  if (!options.plugins)
    options.plugins = []
  if (!Array.isArray(options.plugins))
    options.plugins = [options.plugins]

  // ------------------- FileInfo ---------------------
  options.plugins.push(FileInfo('rolldown'))

  // ------------------- Resolve & Alias ----------------------
  options.resolve = {
    ...(config.resolve || {}),
    alias: {
      ...(config.aliasExtractor !== false ? AliasAnalyzer('rolldown') : {}),
      ...(config.alias || {}),
    },
  }

  // ------------------- Vue Files -------------------
  if (typeof config.vue !== 'boolean' && typeof config.vue !== 'object')
    config.vue = true
  if (config.vue !== false) {
    if (typeof config.vue === 'object')
      options.plugins.push(RolldownVue(config.vue))
    else if (config.vue === true)
      options.plugins.push(RolldownVue())
  }

  // ------------------- PostCSS -------------------
  if (config.postcss !== false) {
    options.plugins.push(PostCSS(config.postcss) as any)
  }

  return options
}

export async function buildWithRolldown(config: RolldownBuilderConfig): Promise<void> {
  const options = resolveRolldownConfig(config)
  if (!options.output)
    return

  const rolldownBuilder = await rolldown(options)

  if (Array.isArray(options.output)) {
    for (const output of options.output) {
      await rolldownBuilder.write(output)
    }
  }
  else if (options.output) {
    await rolldownBuilder.write(options.output)
  }
}
