import type { RollupOptions } from 'rollup'
import type { CompilerOptions, ModuleKind, ModuleResolutionKind, ScriptTarget } from 'ts-morph'
import type { JsxEmit } from 'typescript'

export interface VueOptions {
  /**
   * Specify the `@vue/compiler-sfc` package.
   */
  compiler?: typeof import('@vue/compiler-sfc')
}

export interface DefaultCompilerOptions extends CompilerOptions {
  target: ScriptTarget.ES2022
  module: ModuleKind.ES2022
  moduleResolution: ModuleResolutionKind.Bundler
  declaration: true
  emitDeclarationOnly: true
  skipDefaultLibCheck: true
  skipLibCheck: true
  strictPropertyInitialization: false

  /// Default vue jsx options. If set `DtsBuildOptions.vue` to `false`, those options will not be defined.
  jsx?: JsxEmit.Preserve
  jsxFactory?: 'h'
  jsxFragmentFactory?: 'Fragment'
  jsxImportSource?: 'vue'
}

export interface Plugin {
  name: string
  config?: (options: DtsBuildOptions) => void | Promise<void>
  beforeRunRollup?: (options: DtsBuildOptions, rollupOptions: RollupOptions) => void | Promise<void>
}

export interface DtsBuildOptions {
  /**
   * Specify the entry file(s) to build. Only support `.ts` `.tsx` `.js` `.jsx` files, `not support` directories、`.vue` files and glob pattern.
   */
  entry?: string[]
  /**
   * Specify the include file(s) to build. Can be a glob pattern.
   */
  include?: string[]
  /**
   * Override the compiler options.
   *
   * @see Default value see {@linkcode DefaultCompilerOptions}.
   */
  compilerOptions?: CompilerOptions
  /**
   * If you want disable, set `false`.
   *
   * @default true
   */
  vue?: VueOptions | false
  /**
   * Specify the output directory.
   *
   * @default path.resolve('./dist')
   */
  outDir?: string
  /**
   * Specify the cache .d.ts files directory.
   *
   * @default './{outDir}/.cache'
   */
  cacheDir?: string
  /**
   * Specify the plugins.
   */
  plugins?: Plugin[]
  /**
   * @default true
   */
  removeCacheDirOnExit?: boolean
}
