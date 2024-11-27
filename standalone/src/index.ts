import { foo } from './test'
import testComp, { type TestCompProps } from './test-comp.vue'

export function test(): string {
  return foo
}

export * from './nest-dir/hello-nest-file-2'

export { foo, testComp, type TestCompProps }
