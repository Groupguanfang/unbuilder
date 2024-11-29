<script setup lang="ts">
import { ref } from 'vue'

export interface TestCompProps {
  /**
   * Message.
   */
  msg2: string
}

defineProps<TestCompProps>()

const msg = ref('Hello world')
</script>

<template>
  <div>Hello world, {{ msg }}</div>
</template>

<style scoped lang="less">
.test {
  color: red;
}
</style>
