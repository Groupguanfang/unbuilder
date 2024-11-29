import test, { Props } from './test.vue'

import './nest-dir'

export const a: string = 'Hello world'

export default test

export { Props }

export function dynamicImportTest(): Promise<typeof import('./dynamic-import')> {
  return import(`./dynamic-import`)
}
