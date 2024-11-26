import type { BuilderConfig, CommonBuilderConfig } from './types'
import { buildDtsWithRollup } from './dts'
import { buildWithEsbuild } from './esbuild'
import { buildWithRollup } from './rollup'

export async function build(builderConfig: BuilderConfig, commonBuildConfig?: CommonBuilderConfig): Promise<void> {
  if (commonBuildConfig && typeof commonBuildConfig === 'object') {
    builderConfig = {
      ...commonBuildConfig,
      ...builderConfig,
    }
  }

  if (builderConfig.builder === 'esbuild') {
    await buildWithEsbuild(builderConfig)
  }
  else if (builderConfig.builder === 'rollup') {
    await buildWithRollup(builderConfig)
  }
  else if (builderConfig.builder === 'rollup-dts') {
    await buildDtsWithRollup(builderConfig)
  }
}
