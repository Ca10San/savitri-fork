<template>
  <sv-modal>
    <template #title>
      <slot name="title"></slot>
    </template>

    <template #body>
      <slot name="body"></slot>
    </template>

    <template #footer>
      <sv-button
        v-for="(action, index) in actions"
        :key="`action-${index}`"
        :type="action.type"

        @clicked="onClick(action)"
      >
        {{ action.title }}
      </sv-button>
    </template>
  </sv-modal>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useStore } from '@savitri/web'
import { SvButton } from '../../'

const SvModal = defineAsyncComponent(() => import('../../organisms/sv-modal/sv-modal.vue'))
const metaStore = useStore('meta')

type Props = {
  actions: Array<any>
}

const props = defineProps<Props>()

const onClick = (answer: any) => {
  metaStore.fulfillPrompt(answer)
}
</script>
