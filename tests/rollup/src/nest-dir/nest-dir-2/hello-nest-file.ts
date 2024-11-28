import { helloNestFile2 } from '../../nest-dir/hello-nest-file-2'
import TestComp from '../../test-comp.vue'

export function helloNestFile(): string {
  return helloNestFile2()
}

export function helloNestVueComponent(): typeof TestComp {
  return TestComp
}
