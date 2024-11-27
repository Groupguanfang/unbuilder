import type { BuilderConfigType } from '../types'
import { logWithBuilder } from '../logger'
import { readPackageJson } from '../utils'

export type ExternalFn = (id: string) => boolean

export function PackageJsonExternal(type: 'deps', builder: BuilderConfigType): ExternalFn
export function PackageJsonExternal(type: 'excludes', builder: BuilderConfigType): string[]
export function PackageJsonExternal(type: 'deps' | 'excludes', builder: BuilderConfigType): ExternalFn | string[] {
  const packageJson = readPackageJson()

  if (type === 'deps') {
    return (id: string) => {
      const result = Object.keys(packageJson.dependencies || {}).includes(id)
      logWithBuilder(builder, 'auto determined external:', JSON.stringify(result))
      return result
    }
  }

  const peerDeps = packageJson.peerDependencies || {}
  const devDeps = packageJson.devDependencies || {}
  const optDeps = packageJson.optionalDependencies || {}
  const allDeps = { ...peerDeps, ...devDeps, ...optDeps }

  const result = Object.keys(allDeps)
  logWithBuilder(builder, 'auto determined external:', JSON.stringify(result))
  return result
}
