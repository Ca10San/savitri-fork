<template>
  <div class="dropdown">
    <div
      @click="visible = !visible"
      class="cursor-pointer z-40"
    >
      <slot name="trigger"></slot>
    </div>
    <div v-if="visible" class="dropdown__content">
      <!-- <sv-overlay -->
      <!--   :invisible="false" -->
      <!--   @click="visible = false" -->
      <!-- ></sv-overlay> -->
      <slot name="content"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
</script>

<style scoped src="./sv-dropdown.scss"></style>
