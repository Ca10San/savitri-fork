<template>
  <div class="signup">
    <sv-icon
      v-clickable
      name="arrow-left"
      @click="$router.push({ name: 'user-signin' })"
    >
      Efetuar login
    </sv-icon>

    <sv-form
      v-bind="{
        formData: userStore.item,
        form: userStore.useFields([
          'first_name',
          'last_name',
          'email',
          'phone'
        ])
      }"
    ></sv-form>

    <sv-button @clicked="$router.push({ name: 'user-signupExtra' })">
      Próximo
    </sv-button>
  </div>
</template>

<script setup lang="ts">
import { useParentStore } from '@savitri/web'
import { SvForm, SvIcon, SvButton } from '@savitri/components'

const userStore = useParentStore()
</script>

<style scoped src="./signup.scss"></style>
