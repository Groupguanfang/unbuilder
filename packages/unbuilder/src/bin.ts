import type { BuilderConfig } from './types'
import { cwd } from 'node:process'
import { loadConfig } from 'c12'
import { build } from './loader'
import { defineConfig } from './types'

loadConfig<any>({
  name: 'unbuilder',
  packageJson: true,
  globalRc: true,
  cwd: cwd(),
}).then(async (result) => {
  const configuration = defineConfig(
    Array.isArray(result.config)
      ? result.config
      : (result.config && result.config.config)
          ? result.config.config
          : result.config,
  )

  if (!Array.isArray(configuration)) {
    return build(configuration as BuilderConfig)
  }
  else {
    return Promise.all(configuration.map((config: BuilderConfig) =>
      build(config, configuration.find((c: BuilderConfig) => (c || {}).builder === 'common') || { builder: 'common' })),
    )
  }
})
