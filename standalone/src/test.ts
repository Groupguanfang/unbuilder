import CommonComp from './common-comp.vue'
import { CommonFunc1 } from './common-func'

export function TestWorld(): string {
  return 'TestWorld'
}

export function Foo(): string {
  return CommonFunc1()
}

export { CommonComp }
