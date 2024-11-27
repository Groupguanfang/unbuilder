import CommonComp from './common-comp.vue'
import { CommonFunc1 } from './common-func'

export function TestWorld(): string {
  return 'TestWorld'
}

export function Foo(): { CommonFunc1: string, CommonComp: typeof CommonComp } {
  return {
    CommonFunc1: CommonFunc1(),
    CommonComp,
  }
}

export { CommonComp }
