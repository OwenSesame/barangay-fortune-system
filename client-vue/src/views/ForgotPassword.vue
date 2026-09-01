<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const email = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const handleReset = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  isLoading.value = true

  try {
    const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email: email.value })
    successMsg.value = res.data.message || 'Password reset link has been sent to your email.'
    email.value = ''
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Failed to process request.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-brand-gray flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-brand-blue mb-4">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
        </div>
        <h2 class="text-2xl font-extrabold text-gray-900 mb-2">Reset Password</h2>
        <p class="text-sm text-gray-500">Enter your email address and we'll send you instructions to reset your password.</p>
      </div>

      <form @submit.prevent="handleReset" class="space-y-5">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2 uppercase">Email Address</label>
          <input type="email" v-model="email" required class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors outline-none bg-gray-50" placeholder="Enter your email" />
        </div>

        <div v-if="errorMsg" class="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-start gap-2">
           <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
           {{ errorMsg }}
        </div>

        <div v-if="successMsg" class="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm border border-emerald-100 flex items-start gap-2">
           <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
           {{ successMsg }}
        </div>

        <button type="submit" :disabled="isLoading" class="w-full bg-brand-blue hover:bg-brand-light-blue text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md disabled:bg-brand-light-blue disabled:cursor-not-allowed">
          {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <a href="#" @click.prevent="router.push('/')" class="text-sm font-bold text-gray-600 hover:text-brand-blue transition-colors inline-flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Login
        </a>
      </div>

    </div>
  </div>
</template>
