<script setup>
import './assets/css/style.css'
import { ref, computed, onMounted, provide } from 'vue';
import { ACCENTS } from './data.js';

const accentKey = ref('indigo');
const accent = computed(() => ACCENTS[accentKey.value] || ACCENTS.indigo);

// Provide globally to descendant components
provide('accent', accent);
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
