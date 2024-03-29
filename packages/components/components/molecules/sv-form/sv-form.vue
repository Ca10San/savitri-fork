<template>
  <form class="form">
    <fieldset
      v-if="!isReadonly && Object.keys(fields).length > 0"
      class="form__fieldset"
    >
      <!-- form -->
      <div
        v-for="([key, field], index) in fields"
        :key="`field-${index}`"
        :class="`form__field ${fieldClass(field)}`"
        :style="fieldSpan(field)"

        @input="$emit('input', key)"
      >
        <!-- text -->
        <sv-input
          v-if="isTextType(field.type)"
          v-model="formData[key]"
          v-bind="{
            ...field,
            readOnly: field.readOnly && !searchOnly
          }"
        >
          <template #label>{{ field.label }}</template>
          <template #description v-if="field.description">{{ field.description }}</template>
        </sv-input>

        <!-- checkbox, radio, boolean, select -->
        <div v-else-if="isSelectType(field.type)">
          <strong>
            {{ field.translate ? $t(field.label) : field.label }}
          </strong>
          <div>
            {{ field.description }}
          </div>

          <div v-if="field.type !== 'select'" class="form__options-grid">
            <sv-checkbox
              v-if="['checkbox', 'radio'].includes(field.type)"
              v-for="(value, vindex) in field.values"
              :key="`value-${vindex}`"

              v-model="formData[key]"
              v-bind="{
                array: true,
                value: value.value,
                label: field.translate ? $t(value.label||'') : value.label,
                description: value.description,
                isRadio: field.type === 'radio',
                readOnly: field.readOnly
              }"
            ></sv-checkbox>

            <sv-checkbox
              v-else-if="field.type === 'boolean'"
              v-model="formData[key]"

              v-bind="{
                value: formData[key] == true,
                readOnly: field.readOnly,
                label: field.label
              }"
            ></sv-checkbox>
          </div>

          <sv-select
            v-else
            v-model="formData[key]"
            :values="field.values"
            style="width: 100%"
          >
            <option value="">{{ $t('none') }}</option>
            <option v-for="(option, oindex) in field.values" :value="option.value">
              {{ field.translate ? $t(option.label) : option.label }}
            </option>
          </sv-select>
        </div>

        <div v-if="field.collection === 'file'">
          <strong class="text-xs uppercase">{{ field.label }}</strong>
          <sv-file v-model="formData[key]" :context="`${collection}.${itemIndex}.${key}.${fieldIndex}`"></sv-file>
        </div>

        <!-- <sv-input -->
        <!--   v-else-if="field.collection" -->
        <!--   v-bind="inputBind(field, key)" -->
        <!-- > -->
        <!--   {{ field.label }} -->
        <!-- </sv-input> -->

        <div v-if="store?.validationErrors[key]" class="form__validation-error">
          <span>{{ $t(`validation_error.${store.validationErrors[key].type}`) }}</span>
          <span v-if="store.validationErrors[key].detail">
            {{ $t(store.validationErrors[key].detail) }}
          </span>
        </div>
      </div>
    </fieldset>

    <div
      v-if="!isReadonly && store && referencedFields.length > 0"
      class="form__search-grid"
    >
      <sv-search
        v-for="([childCollection, field], index) in referencedFields"
        :key="`collectionfield-${index}`"

        v-model="formData[childCollection]"
        v-bind="{
          field,
          collection,
          indexes: store.getIndexes({ key: childCollection }),
          propName: childCollection,
          itemIndex: itemIndex != -1 ? itemIndex: 0,
          activeOnly: 'active' in field.fields,
          searchOnly: !field.inlineEditing
        }"

        @changed="$emit('change')"
      ></sv-search>
    </div>

    <fieldset v-if="isReadonly" class="form__fieldset">
      <sv-input
        v-for="([key, field], index) in allInOne"
        :key="`collection-${index}`"

        v-bind="{
          ...inputBind(field, key),
          value: store.formatValue({
            value: field.translate ? $t(props.formData[key]||'') : props.formData[key],
            key,
            field,
            form: true
          })
        }"

        :class="fieldClass(field)"
        :style="fieldSpan(field)"
      >
        {{ field.label }}
      </sv-input>
    </fieldset>
  </form>
</template>

<script setup lang="ts">
import { defineAsyncComponent, provide, inject, reactive } from 'vue'
import { useStore } from '@savitri/web'
import { SvInput, SvCheckbox, SvSelect } from '../..'

import SvSearch from './_internals/components/sv-search/sv-search.vue'
const SvFile = defineAsyncComponent(() => import('../../molecules/sv-file/sv-file.vue'))

type LayoutConfig = {
  span: number
}

type Props = {
  form: Record<string, any>
  formData: Record<string, any>
  collection?: string
  isReadonly?: boolean
  searchOnly?: boolean
  itemIndex?: number
  fieldIndex?: number
  layout?: Record<string, LayoutConfig>

  // currently unused!
  strict?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isReadonly: false,
  searchony: false,
  strict: true,
  itemIndex: 0,
  fieldIndex: 0
})

const emit = defineEmits<{
  (e: 'update:formData', value: any): void
  (e: 'input', value: string): void
  (e: 'change', value: string): void
}>()

const collectionName = props.collection || inject('storeId', null)
const store = collectionName
  ? useStore(collectionName.value||collectionName)
  : null

if( !collectionName && process.env.NODE_ENV !== 'production' ) {
  console.warn(
    `sv-form was used without providing storeId or specifying
    collection prop, some features may not work as intended`
  )
}

provide('storeId', collectionName)
provide('searchOnly', props.searchOnly||false)

const filterFields = (condition: (f: any) => boolean) => 
  Object.entries(props.form)
    .filter(([key, field]: [string, any]) => (
      field
        && (!field.noform || props.searchOnly)
        && (!condition || condition([key, field]))
    ))
    .map(([key, field]: [string, any]) => [key, {
      ...field,
      hidden: undefined,
    }])

const has = (field: string) => {
  if( props.searchOnly || !collectionName ) {
    return true
  }

  const formFields = store.description?.form
  return !formFields || formFields.includes(field)
}

const fields = filterFields(([key, f]: [string, any]) => {
  return (!(typeof f.collection === 'string' && (!f.readOnly || props.searchOnly)) || f.collection === 'file')
    && !f.meta
    && has(key)
})

const referencedFields = filterFields(([key, f]: [string, any]) => {
  return typeof f.collection === 'string'
    && f.collection !== 'file'
    && has(key)
    && (!f.readOnly || props.searchOnly)
})
  .map(([key, value]: [string, any]) => {
    const store = useStore(value.collection)
    return [
      key, {
        ...value,
        ...store.description
      }
    ]
  })


const allInOne = filterFields()
  .sort((a: any, b: any) => typeof a.collection === typeof b.collection ? 1 : -1)
  .map(([key, field]: [string, any]) => {
    return [key, {
    ...field,
  }]
})

const isTextType = (type: string) => {
  return [
    'text',
    'textbox',
    'password',
    'number',
    'integer',
    'datetime'
  ].includes(type)
}

const isSelectType = (type: string) => {
  return [
    'checkbox',
    'radio',
    'boolean',
    'select'
  ].includes(type)
}

const fieldClass = (field: any) => {
  if( field.formStyle ) {
    return field.formStyle
  }

  return ''
}

const fieldSpan = (field: any) => {
  const span =  props.layout?.[key]?.span
    ? props.layout[key].span
    : field.formSpan || 6 

  return `
    --field-span: ${span};
    grid-column: span var(--field-span) / span var(--field-span);
  `
}

const inputBind = (field: any, key: string, value: any) => {
  if( !store ) {
    return props.formData[key]
  }

  return {
    ...field,
    readOnly: true,
    type: isTextType(field.type) ? field.type : 'text',
    value,
  }
}
</script>

<style scoped src="./sv-form.scss"></style>
