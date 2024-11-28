<script setup lang="ts">
export interface Props {
  /**
   * Hello world
   */
  hello: string
}

defineProps<Props>()

const names: string = 'World'
</script>

<template>
  <div>Hello world, {{ names }}</div>
</template>
