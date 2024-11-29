#!/usr/bin/env node

import type { BuilderConfig } from './types'
import { cwd } from 'node:process'
import { loadConfig } from 'c12'
import k from 'kleur'
import { version } from '../package.json'
import { build } from './loader'
import { log } from './logger'
import { defineConfig } from './types'

log(`version: ${k.dim(version)}`)

loadConfig<any>({
  name: 'unbuilder',
  packageJson: true,
  globalRc: true,
  cwd: cwd(),
}).then(async (result) => {
  const currentTime = Date.now()

  let configuration = defineConfig(
    Array.isArray(result.config)
      ? result.config
      : (result.config && result.config.config)
          ? result.config.config
          : result.config,
  )

  if (Array.isArray(result.layers) && result.layers.find(layer => layer.configFile === 'unbuilder.config')) {
    const findLayer = result.layers.find(layer => layer.configFile === 'unbuilder.config')

    configuration = defineConfig(
      Array.isArray(findLayer.config)
        ? findLayer.config
        : (findLayer.config && findLayer.config.config)
            ? findLayer.config.config
            : findLayer.config,
    )
  }

  if (!Array.isArray(configuration)) {
    await build(configuration as BuilderConfig)
  }
  else {
    await Promise.all(configuration.map((config: BuilderConfig) =>
      build(config, configuration.find((c: BuilderConfig) => (c || {}).builder === 'common') || { builder: 'common' })),
    )
  }

  function formatTime(time: number): string {
    return time < 1000
      ? `${time}ms`
      : `${(time / 1000).toFixed(2)}s`
  }

  log(`✨Done in ${formatTime(Date.now() - currentTime)}.`)
})
