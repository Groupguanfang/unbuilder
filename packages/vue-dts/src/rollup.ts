import type { RollupOptions } from 'rollup'
import type { CompilerOptions } from 'typescript'
import type { DtsBuildOptions } from './types'
import path from 'node:path'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { rollup } from 'rollup'
import { dts } from 'rollup-plugin-dts'
import FileInfo from './file-info'

export interface RollupService {
  run: (options?: DtsBuildOptions) => Promise<void>
}

export function useRollup(input: string[], compilerOptions: CompilerOptions): RollupService {
  return {
    async run(options = {}) {
      const rollupOptions: RollupOptions = {
        input,

        plugins: [
          nodeResolve({
            extensions: ['.mjs', '.js', '.json', '.node', '.cjs', '.ts', '.tsx', '.jsx'],
          }),

          dts({
            compilerOptions: compilerOptions as Parameters<typeof dts>[0]['compilerOptions'],
          }),

          FileInfo(),
        ],

        output: {
          dir: options.outDir || path.resolve('dist'),
          format: 'es',
        },
      }

      // 运行插件的`beforeRunRollup`方法, 让插件可以修改`rollupOptions`参数
      for (const plugin of options.plugins || [])
        if (plugin.beforeRunRollup)
          await plugin.beforeRunRollup(options, rollupOptions)

      const rollupBuild = await rollup(rollupOptions)
      if (Array.isArray(rollupOptions.output))
        for (const outputOptions of rollupOptions.output)
          await rollupBuild.write(outputOptions)
      else
        await rollupBuild.write(rollupOptions.output)
    },
  }
}
