<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const credentials = ref({
  role: 'Resident',
  identifier: '',
  password: ''
})
const errorMsg = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  errorMsg.value = ''
  isLoading.value = true
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', credentials.value)
    const userId = res.data.id || res.data.userId
    
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('userId', userId)
    localStorage.setItem('role', res.data.role) // Vue pages expect 'role'
    localStorage.setItem('userRole', res.data.role) // For backwards compatibility
    localStorage.setItem('firstName', res.data.firstName || '')
    localStorage.setItem('residentId', res.data.residentId || '')
    
    if (res.data.role === 'Admin') router.push('/admin-dashboard')
    else if (res.data.role === 'Staff') router.push('/staff-home')
    else router.push('/resident-dashboard')
  } catch (err) {
    errorMsg.value = err.response?.data?.error || err.response?.data?.message || 'Login failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-brand-gray flex items-center justify-center p-4">
    <div class="w-full max-w-md dashboard-card p-8 shadow-md">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-brand-blue rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-800">Welcome Back</h2>
        <p class="text-sm text-gray-500 mt-1">Sign in to access your dashboard</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2 uppercase">Account Type</label>
          <select v-model="credentials.role" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors outline-none bg-gray-50 text-gray-900 cursor-pointer">
            <option value="Resident">Resident</option>
            <option value="Staff">Barangay Staff</option>
            <option value="Admin">Administrator</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2 uppercase">{{ credentials.role === 'Resident' ? 'Email Address' : 'Username' }}</label>
          <input :type="credentials.role === 'Resident' ? 'email' : 'text'" v-model="credentials.identifier" required class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors outline-none bg-gray-50" :placeholder="credentials.role === 'Resident' ? 'Enter your email' : 'Enter your username'" />
        </div>
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-semibold text-gray-700 uppercase">Password</label>
            <a v-if="credentials.role === 'Resident'" href="#" @click.prevent="router.push('/forgot-password')" class="text-sm text-brand-blue hover:underline font-medium">Forgot password?</a>
          </div>
          <input type="password" v-model="credentials.password" required class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors outline-none bg-gray-50" placeholder="Enter your password" />
        </div>

        <div v-if="errorMsg" class="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2">
           <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
           {{ errorMsg }}
        </div>

        <button type="submit" :disabled="isLoading" class="w-full bg-brand-blue hover:bg-brand-light-blue text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md disabled:bg-brand-light-blue disabled:cursor-not-allowed">
          {{ isLoading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <p class="text-center text-sm text-gray-600 mt-8">
        Don't have an account? 
        <a href="#" @click.prevent="router.push('/register')" class="text-brand-blue font-bold hover:underline">Register here</a>
      </p>
    </div>
  </div>
</template>
