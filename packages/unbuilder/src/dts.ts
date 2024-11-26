import type { InputOption, RollupOptions } from 'rollup'
import type { CompilerOptions } from 'typescript'
import type { RollupDtsBuilderConfig } from './types'
import { execSync } from 'node:child_process'
import fs, { writeFileSync } from 'node:fs'
import path from 'node:path'
import Alias from '@rollup/plugin-alias'
import nodeResolve from '@rollup/plugin-node-resolve'
import { rollup } from 'rollup'
import { dts } from 'rollup-plugin-dts'
import { OutputAnalyzer, RollupAliasAnalyzer } from './analyzers'
import { PackageJsonEntry } from './analyzers/entry-analyzer'
import FileInfo from './file-info'
import { readTsConfigCompilerOptions, transformTsConfigPathsToCacheDir } from './utils'

let __dirname = globalThis.__dirname
if (!globalThis.__dirname)
  __dirname = new URL('.', import.meta.url).pathname

interface VueTscRunnerReturn {
  cacheDir: string
  cacheConfigPath: string
  include: string[]
  output?: string[]
}

async function runVueTsc(input: InputOption): Promise<VueTscRunnerReturn> {
  const compilerOptions = readTsConfigCompilerOptions()
  const hash = Math.random().toString(36).slice(2)
  const cacheDir = path.join(__dirname, '../cache/vue-tsc', `${Date.now()}-${hash}`)
  const cacheConfigPath = path.join(__dirname, `../cache/vue-tsc/tsconfig.vue-tsc-${hash}.json`)
  if (!fs.existsSync(cacheDir))
    fs.mkdirSync(cacheDir, { recursive: true })

  writeFileSync(cacheConfigPath, JSON.stringify({
    compilerOptions: {
      target: 'ES2022' as any,
      jsx: 'preserve' as any,
      jsxFactory: 'h',
      jsxFragmentFactory: 'Fragment',
      jsxImportSource: 'vue',
      module: 'ES2022' as any,
      moduleResolution: 'Bundler' as any,
      declaration: true,
      emitDeclarationOnly: true,
      outDir: cacheDir,
      skipDefaultLibCheck: true,
      skipLibCheck: true,
      paths: transformTsConfigPathsToCacheDir(compilerOptions.paths),
    } as CompilerOptions,
    include: (Array.isArray(input) ? input : Object.values(input || {})).map(i => path.resolve(i)),
  }, null, 2))

  execSync(`vue-tsc -p ${cacheConfigPath}`, {
    stdio: 'inherit',
  })

  // process.addListener('exit', () => {
  //   fs.rmdirSync(cacheDir, { recursive: true })
  // })

  return {
    cacheDir,
    cacheConfigPath,
    include: (Array.isArray(input) ? input : Object.values(input)).map(i => path.resolve(i)),
    output: (Array.isArray(input) ? input : Object.values(input)).map((i) => {
      return path.resolve(cacheDir, path.basename(i)).replace(/\.ts$/, '.d.ts')
    }),
  }
}

async function resolveDtsConfig(config: RollupDtsBuilderConfig): Promise<RollupOptions> {
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
  if (config.outputExtractor !== false) {
    const analyzed = OutputAnalyzer({}, config.builder)
    if (analyzed[0] && analyzed[0].dir) {
      options.output = {
        dir: analyzed[0].dir,
        format: 'es',
      }
    }
  }

  // 默认情况下，使用`vue-tsc`代替`tsc`生成d.ts文件，因为`vue-tsc`可以处理.vue文件，
  // 同时兼容`vue-tsc`和`tsc`的配置文件
  if (config.vue !== false) {
    // 运行`vue-tsc`来生成vue文件的`.d.ts`文件
    const { output } = await runVueTsc(options.input)
    // 让`rollup-plugin-dts`来二次处理`vue-tsc`生成的`.d.ts`文件
    options.input = output
  }

  // fix一下rollup的插件配置
  if (!options.plugins)
    options.plugins = []
  if (!Array.isArray(options.plugins))
    options.plugins = [options.plugins]

  options.plugins.push(FileInfo('rollup-dts'))

  // ------------------- Resolve ---------------------
  const nodeResolveOptions = {
    extensions: ['.mjs', '.js', '.json', '.node', '.jsx', '.ts', '.tsx'],
    ...config.resolve,
  }
  if (config.resolve !== false) {
    options.plugins.push(nodeResolve(nodeResolveOptions))
  }

  // ------------------- Alias -----------------------
  options.plugins.push(Alias({
    entries: [
      ...(config.aliasExtractor !== false ? RollupAliasAnalyzer('rollup-dts') : []),
      ...(Object.keys(config.alias || {}).map(key => ({
        find: key,
        replacement: config.alias[key],
      }))),
    ],
  }))

  // 添加`rollup-plugin-dts`插件
  options.plugins.push(dts(config.dtsOptions))

  return options
}

export async function buildDtsWithRollup(config: RollupDtsBuilderConfig): Promise<void> {
  const options = await resolveDtsConfig(config)

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
