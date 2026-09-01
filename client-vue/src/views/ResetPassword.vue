<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const handleReset = async () => {
  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'Passwords do not match.'
    return
  }

  errorMsg.value = ''
  successMsg.value = ''
  isLoading.value = true

  const token = route.params.token
  const email = route.query.email

  try {
    const res = await axios.post('http://localhost:5000/api/auth/reset-password', {
      email,
      token,
      newPassword: password.value
    })
    successMsg.value = 'Password successfully reset! You can now sign in.'
    setTimeout(() => {
      router.push('/')
    }, 2000)
  } catch (err) {
    errorMsg.value = err.response?.data?.error || err.response?.data?.message || 'Failed to reset password.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-brand-gray flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 mb-4">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        <h2 class="text-2xl font-extrabold text-gray-900 mb-2">Create New Password</h2>
        <p class="text-sm text-gray-500">Please enter your new password below.</p>
      </div>

      <form @submit.prevent="handleReset" class="space-y-5">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2 uppercase">New Password</label>
          <input type="password" v-model="password" required class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors outline-none bg-gray-50" placeholder="Enter new password" />
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2 uppercase">Confirm Password</label>
          <input type="password" v-model="confirmPassword" required class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors outline-none bg-gray-50" placeholder="Confirm new password" />
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
          {{ isLoading ? 'Resetting...' : 'Reset Password' }}
        </button>
      </form>
    </div>
  </div>
</template>
