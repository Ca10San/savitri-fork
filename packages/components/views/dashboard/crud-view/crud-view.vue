<template>
  <sv-crud
    v-if="route.params.collection"
    :collection="route.params.collection"
    :key="route.params.collection"
  ></sv-crud>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from '@savitri/web'
import SvCrud from '../../../components/templates/sv-crud/sv-crud.vue'

const route = useRoute()
const metaStore = useStore('meta')
const params = reactive({})
</script>
