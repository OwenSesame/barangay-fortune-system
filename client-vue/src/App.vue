<script setup>
import { RouterView } from 'vue-router'
import ToastProvider from './components/ToastProvider.vue'
</script>

<template>
  <ToastProvider />
  <RouterView />
</template>

<style>
/* Global styles can be added here if not using style.css */
</style>
