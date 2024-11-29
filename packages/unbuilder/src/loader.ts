import type { BuilderConfig, CommonBuilderConfig } from './types'
import { buildDtsWithBundleDtsGenerator } from './bundle-dts-generator'
import { buildWithEsbuild } from './esbuild'
import { buildWithRolldown } from './rolldown'
import { buildWithRollup } from './rollup'
import { buildWithTsup } from './tsup'

export async function build(builderConfig: Exclude<BuilderConfig, CommonBuilderConfig>, commonBuildConfig?: CommonBuilderConfig): Promise<void> {
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
  else if (builderConfig.builder === 'rolldown') {
    await buildWithRolldown(builderConfig)
  }
  else if (builderConfig.builder === 'bundle-dts-generator') {
    await buildDtsWithBundleDtsGenerator(builderConfig)
  }
  else if (builderConfig.builder === 'tsup') {
    await buildWithTsup(builderConfig)
  }
}
