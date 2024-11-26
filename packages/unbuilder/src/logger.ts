import type { BuilderConfigType } from './types'
import k from 'kleur'

export function logWithBuilder(builder: BuilderConfigType, ...args: any[]): void {
  // eslint-disable-next-line no-console
  console.log(k.bold().green(`[${builder}]`), ...args)
}

export function log(...args: any[]): void {
  // eslint-disable-next-line no-console
  console.log(k.bold().magenta('[unbuilder]'), ...args)
}
