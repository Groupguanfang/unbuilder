import type { BuilderConfig, CommonBuilderConfig } from './types'
import { buildWithEsbuild } from './esbuild'
import { buildWithRolldown } from './rolldown'
import { buildWithRollup } from './rollup'
import { buildDtsWithRollup } from './rollup-dts'

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
  else if (builderConfig.builder === 'rolldown') {
    await buildWithRolldown(builderConfig)
  }
}
