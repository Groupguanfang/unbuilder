import type { RollupNodeResolveOptions } from '@rollup/plugin-node-resolve'
import type { RollupTypescriptOptions } from '@rollup/plugin-typescript'
import type { RollupBuilderConfig, RollupBuilderTypeScriptSWCOptions } from './types'
import fs from 'node:fs'
import path from 'node:path'
import Alias from '@rollup/plugin-alias'
import CommonJS from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import SWC from '@rollup/plugin-swc'
import typescript from '@rollup/plugin-typescript'
import { type Plugin, rollup, type RollupOptions } from 'rollup'
import PostCSS from 'rollup-plugin-postcss'
import RollupVue from 'unplugin-vue/rollup'
import { OutputAnalyzer } from './analyzers'
import { RollupAliasAnalyzer } from './analyzers/alias.analyzer'
import { PackageJsonEntry } from './analyzers/entry-analyzer'
import { PackageJsonExternal } from './analyzers/external-analyzer'
import FileInfo from './file-info'

function TypeScriptPlugin(mixed: RollupTypescriptOptions = {}): Plugin {
  return typescript({
    tsconfig: fs.existsSync(path.resolve('tsconfig.json'))
      ? fs.readFileSync(path.resolve('tsconfig.json'), 'utf-8')
      : false,
    ...mixed,
  })
}

function SWCPlugin(mixed: Omit<RollupBuilderTypeScriptSWCOptions, 'compiler'> = {}): Plugin {
  return SWC({
    swc: mixed.swc
      ? mixed.swc
      : {
          jsc: {
            parser: {
              syntax: 'typescript',
              decorators: true,
              tsx: true,
            },

            transform: {
              decoratorVersion: '2022-03',
            },
          },
        },
    include: mixed.include,
    exclude: mixed.exclude,
  })
}

export function resolveRollupConfig(config: RollupBuilderConfig): RollupOptions {
  const options = config.rollupOptions || {}

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

  // fix一下rollup的插件配置
  if (!options.plugins)
    options.plugins = []
  if (!Array.isArray(options.plugins))
    options.plugins = [options.plugins]

  options.plugins.push(FileInfo('rollup'))

  // ------------------- Resolve ---------------------
  const nodeResolveOptions: RollupNodeResolveOptions = {
    extensions: ['.mjs', '.js', '.json', '.node', '.jsx', '.ts', '.tsx', '.vue'],
    ...config.resolve,
  }
  if (config.resolve !== false) {
    options.plugins.push(nodeResolve(nodeResolveOptions))
  }

  // ------------------- Alias -----------------------
  options.plugins.push(Alias({
    customResolver: nodeResolve(nodeResolveOptions) as any,
    entries: [
      ...(config.aliasExtractor !== false ? RollupAliasAnalyzer('rollup') : []),
      ...(Object.keys(config.alias || {}).map(key => ({
        find: key,
        replacement: config.alias[key],
      }))),
    ],
  }))

  // ------------------- Vue Files -------------------
  if (typeof config.vue !== 'boolean' && typeof config.vue !== 'object')
    config.vue = true
  if (config.vue !== false) {
    if (typeof config.vue === 'object')
      options.plugins.push(RollupVue(config.vue))
    else if (config.vue === true)
      options.plugins.push(RollupVue())
  }

  // ------------------- PostCSS -------------------
  if (config.postcss !== false) {
    options.plugins.push(PostCSS({
      extract: true,
      ...config.postcss,
    }))
  }

  // ------------------- CommonJS -------------------
  if (config.commonjs !== false) {
    options.plugins.push(CommonJS(config.commonjs))
  }

  // ------------------- TypeScript or SWC -------------------

  // Default use swc
  if (!config.typescript)
    config.typescript = 'swc'

  if (typeof config.typescript === 'object') {
    if (config.typescript.compiler === 'tsc') {
      options.plugins.push(TypeScriptPlugin(config.typescript))
    }
    else if (config.typescript.compiler === 'swc') {
      options.plugins.push(SWCPlugin(config.typescript))
    }
  }
  else if (typeof config.typescript === 'string') {
    if (config.typescript === 'tsc') {
      options.plugins.push(TypeScriptPlugin())
    }
    else if (config.typescript === 'swc') {
      options.plugins.push(SWCPlugin())
    }
  }

  return options
}

export async function buildWithRollup(config: RollupBuilderConfig): Promise<void> {
  const options = resolveRollupConfig(config)

  const rollupBuild = await rollup(options)
  if (!options.output)
    return

  if (!Array.isArray(options.output)) {
    await rollupBuild.write(options.output)
  }
  else {
    for (const output of options.output)
      await rollupBuild.write(output)
  }
}
