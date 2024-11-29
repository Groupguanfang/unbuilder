import type { RollupCommonJSOptions } from '@rollup/plugin-commonjs'
import type { RollupNodeResolveOptions } from '@rollup/plugin-node-resolve'
import type { RollupTypescriptOptions } from '@rollup/plugin-typescript'
import type { FilterPattern } from '@rollup/pluginutils'
import type { Options as SWCOptions } from '@swc/core'
import type { DtsBuildOptions } from 'bundle-dts-generator'
import type { BuildOptions } from 'esbuild'
import type { InputOptions, OutputOptions } from 'rolldown'
import type { RollupOptions } from 'rollup'
import type { PostCSSPluginConf } from 'rollup-plugin-postcss'
import type { Arrayable } from 'type-fest'
import type RollupVue from 'unplugin-vue/rollup'

export interface CommonBuilderConfigBase {
  /**
   * Automatically detect the entry file from `package.json`.
   *
   * If set to a string, it will be used as your `workspace` directory.
   *
   * @default './src'
   */
  entryExtractor?: boolean | string
  /**
   * Automatically detect the external dependencies from `package.json`.
   *
   * The rules same as `tsup`:
   * - If the dependency is in `dependencies`, it will be external;
   * - Else if the dependency is in `peerDependencies` or `devDependencies` or `optionalDependencies`, it will be bundled.
   *
   * @default true
   */
  outputExtractor?: boolean
  /**
   * Default is `true`. When enabled, the builder will automatically detect the alias from `tsconfig.json`.
   *
   * If set to a string, it will be used as the path to the tsconfig file.
   *
   * @default true
   */
  aliasExtractor?: boolean | string
  /**
   * Enable `.vue` file support. Default is enabled.
   *
   * @note In `rollup-dts` builder, will use `vue-tsc` to generate `.d.ts` files.
   * @default true
   */
  vue?: Parameters<typeof RollupVue>[0] | boolean
  /**
   * Extra alias for the builder.
   *
   * @default {}
   */
  alias?: Record<string, string>
}

export interface CommonBuilderConfig extends CommonBuilderConfigBase {
  builder: 'common'
}

export interface EsbuildBuilderConfig extends CommonBuilderConfigBase {
  builder: 'esbuild'
  esbuildOptions?: BuildOptions
}

export type RollupBuilderTypeScriptCompiler = 'tsc' | 'swc'

export interface RollupBuilderTypeScriptTscOptions {
  compiler: 'tsc'
  tsc?: RollupTypescriptOptions
}

export interface RollupBuilderTypeScriptSWCOptions {
  compiler: 'swc'
  swc?: SWCOptions
  include?: FilterPattern
  exclude?: FilterPattern
}

export type RollupBuilderTypeScriptOptions = RollupBuilderTypeScriptTscOptions | RollupBuilderTypeScriptSWCOptions

export interface RollupBuilderResolveOptions extends RollupNodeResolveOptions {
  /**
   * Specifies the extensions of files that the plugin will operate on.
   * @default ['.mjs', '.js', '.json', '.node', '.jsx', '.ts', '.tsx']
   */
  extensions?: readonly string[]
}

export interface RollupBuilderConfig extends CommonBuilderConfigBase {
  builder: 'rollup'
  /**
   * Rollup node resolve options. If set to `false`, the node resolve plugin will be disabled.
   *
   * By default, we add the following extensions: `['.mjs', '.js', '.json', '.node', '.jsx', '.ts', '.tsx', '.vue']`.
   */
  resolve?: RollupBuilderResolveOptions | false
  /**
   * How to compile TypeScript files. Defaults to 'swc'.
   *
   * @default 'swc'
   */
  typescript?: RollupBuilderTypeScriptOptions | RollupBuilderTypeScriptCompiler
  /**
   * PostCSS plugin options. If set to `false`, the postcss plugin will be disabled.
   *
   * @default { extract: true } // Default to extract css to a file.
   */
  postcss?: PostCSSPluginConf | false
  /**
   * `@rollup/plugin-commonjs` options. If set to `false`, the commonjs plugin will be disabled.
   */
  commonjs?: RollupCommonJSOptions | false
  /**
   * Base rollup options to merge with.
   */
  rollupOptions?: RollupOptions
}

export interface RolldownOptions extends InputOptions {
  output?: OutputOptions | OutputOptions[]
}

export interface RolldownBuilderConfig extends CommonBuilderConfigBase {
  /**
   * Currently rolldown is experimental and may not work as expected.
   */
  builder: 'rolldown'
  /**
   * Specify the base rolldown options.
   */
  rolldownOptions?: RolldownOptions
  /**
   * Specify the resolve options for the builder.
   */
  resolve?: Omit<InputOptions['resolve'], 'alias'>
  /**
   * PostCSS plugin options. If set to `false`, the postcss plugin will be disabled.
   *
   * `[WARNING]!` Currently rolldown cannot support `extract: true` option, will throw an error like:
   * ```bash
   * node:internal/process/promises:391
   * triggerUncaughtException;
   * ^
   *
   * [Error: Rolldown internal error: GenericFailure, TypeError: Cannot read properties of null (reading 'importedIds')] {
   *  code: 'GenericFailure'
   * }
   * ```
   *
   * @default {}
   */
  postcss?: PostCSSPluginConf | false
}

export interface BundleDtsGeneratorBuilderConfig extends CommonBuilderConfigBase {
  builder: 'bundle-dts-generator'

  buildOptions?: DtsBuildOptions
}

export type BuilderConfig = CommonBuilderConfig | BundleDtsGeneratorBuilderConfig | EsbuildBuilderConfig | RollupBuilderConfig | RolldownBuilderConfig
export type BuilderConfigType = Exclude<BuilderConfig['builder'], 'common'>

export function defineConfig(config: Arrayable<BuilderConfig | BuilderConfigType>): Arrayable<BuilderConfig> {
  if (typeof config === 'string')
    return { builder: config }
  if (Array.isArray(config))
    return config.map(c => typeof c === 'string' ? { builder: c } : c)

  return config as Arrayable<BuilderConfig>
}
