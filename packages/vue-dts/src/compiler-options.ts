import type { DefaultCompilerOptions, DtsBuildOptions } from './types'
import { type CompilerOptions, ModuleKind, ModuleResolutionKind, ScriptTarget } from 'ts-morph'
import { JsxEmit } from 'typescript'

export interface DefaultCompilerOptionsService {
  readonly defaultCompilerOptions: DefaultCompilerOptions
}

export function useDefaultCompilerOptions(options: DtsBuildOptions): DefaultCompilerOptionsService {
  return {
    get defaultCompilerOptions() {
      const result: CompilerOptions = {
        target: ScriptTarget.ES2022,
        module: ModuleKind.ES2022,
        moduleResolution: ModuleResolutionKind.Bundler,
        declaration: true,
        emitDeclarationOnly: true,
        skipDefaultLibCheck: true,
        skipLibCheck: true,
        strictPropertyInitialization: false,
      }

      if (options.vue !== false) {
        result.jsx = JsxEmit.Preserve
        result.jsxFactory = 'h'
        result.jsxFragmentFactory = 'Fragment'
        result.jsxImportSource = 'vue'
      }

      return result as DefaultCompilerOptions
    },
  }
}
