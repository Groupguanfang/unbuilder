import type { BuilderConfigType } from '../types'
import { logWithBuilder } from '../logger'
import { readPackageJson } from '../utils'

export type ExternalFn = (id: string) => boolean

/** 相当于`external`函数。 */
export function PackageJsonExternal(type: 'deps', builder: BuilderConfigType): ExternalFn
/** 相当于`noExternal`数组。 */
export function PackageJsonExternal(type: 'excludes', builder: BuilderConfigType): string[]
/** 相当于`external`数组。 */
export function PackageJsonExternal(type: 'deps-array', builder: BuilderConfigType): string[]
export function PackageJsonExternal(type: 'deps' | 'deps-array' | 'excludes', builder: BuilderConfigType): ExternalFn | string[] {
  const packageJson = readPackageJson()

  if (type === 'deps') {
    return (id: string) => {
      const result = Object.keys(packageJson.dependencies || {}).includes(id)
      return result
    }
  }

  if (type === 'deps-array') {
    const result = Object.keys(packageJson.dependencies || {})
    logWithBuilder(builder, 'auto determined external:', JSON.stringify(result))
    return result
  }

  const peerDeps = packageJson.peerDependencies || {}
  const devDeps = packageJson.devDependencies || {}
  const optDeps = packageJson.optionalDependencies || {}
  const allDeps = { ...peerDeps, ...devDeps, ...optDeps }

  const result = Object.keys(allDeps)
  logWithBuilder(builder, 'auto determined external:', JSON.stringify(result))
  return result
}
