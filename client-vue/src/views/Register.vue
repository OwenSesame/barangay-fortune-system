<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const form = ref({
  firstName: '',
  lastName: '',
  middleName: '',
  dateOfBirth: '',
  civilStatus: 'Single',
  contactNumber: '',
  address: '',
  email: '',
  password: '',
  confirmPassword: ''
})
const errorMsg = ref('')
const idPicture = ref(null)

const handleFileChange = (e) => {
  idPicture.value = e.target.files[0]
}

const handleRegister = async () => {
  if (form.value.password !== form.value.confirmPassword) {
    errorMsg.value = "Passwords do not match."
    return
  }
  
  errorMsg.value = ''
  
  const formData = new FormData()
  for (const key in form.value) {
    formData.append(key, form.value[key])
  }
  if (idPicture.value) {
    formData.append('id_proof', idPicture.value)
  }

  try {
    const res = await axios.post('http://localhost:5000/api/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    // Store credentials and auto-login
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('role', 'Resident')
    localStorage.setItem('firstName', form.value.firstName)
    localStorage.setItem('residentId', res.data.residentId)
    
    router.push('/resident-dashboard')
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Registration failed.'
  }
}
</script>

<template>
  <div class="min-h-screen bg-brand-gray py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
    <div class="max-w-3xl w-full dashboard-card p-8">
      <div class="text-center mb-8">
        <h2 class="text-3xl font-extrabold text-gray-900">Resident Registration</h2>
        <p class="mt-2 text-sm text-gray-600">Fill in your details to create an account.</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
            <input type="text" v-model="form.firstName" required class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue outline-none" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
            <input type="text" v-model="form.lastName" required class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue outline-none" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Middle Name</label>
            <input type="text" v-model="form.middleName" class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue outline-none" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
            <input type="date" v-model="form.dateOfBirth" required class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue outline-none" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Civil Status</label>
            <select v-model="form.civilStatus" class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue outline-none bg-white">
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Contact Number</label>
            <input type="text" v-model="form.contactNumber" required class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue outline-none" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-semibold text-gray-700 mb-1">Complete Address</label>
            <input type="text" v-model="form.address" required class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue outline-none" />
          </div>
          <div class="md:col-span-2 mt-4 pt-4 border-t border-gray-200">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Account Security</h3>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
            <input type="email" v-model="form.email" required class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue outline-none" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input type="password" v-model="form.password" required class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue outline-none" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
            <input type="password" v-model="form.confirmPassword" required class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue outline-none" />
          </div>
          <div class="md:col-span-2 mt-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <label class="block text-sm font-bold text-brand-blue mb-1">Upload Valid ID</label>
            <input type="file" @change="handleFileChange" accept="image/*" required class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-brand-light-blue cursor-pointer" />
          </div>

          <!-- Mandatory Data Privacy Act Disclosure Box -->
          <div class="md:col-span-2 mt-2 bg-gray-50 border border-gray-200 p-4 rounded-xl">
            <h6 class="font-bold mb-2 text-sm text-gray-800 flex items-center gap-2">
              <svg class="w-5 h-5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              Data Privacy Notice
            </h6>
            <div class="text-gray-600 text-xs mb-3 leading-relaxed">
              In line with the Data Privacy Act, the Barangay Fortune Management System protects your personal data. By signing up, you agree to let the system securely store and process your profile details. This info is used strictly for official barangay records and document request processing.
            </div>
            <div class="flex items-start gap-2">
              <input type="checkbox" required id="privacyCheck" class="mt-1 w-4 h-4 text-brand-blue bg-white border-gray-300 rounded focus:ring-brand-blue focus:ring-2 cursor-pointer" />
              <label for="privacyCheck" class="text-xs text-gray-700 cursor-pointer select-none leading-relaxed">
                I understand and agree to let Barangay Fortune collect and safely handle my personal information.
              </label>
            </div>
          </div>
        </div>

        <div v-if="errorMsg" class="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2">
           <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
           {{ errorMsg }}
        </div>

        <button type="submit" class="w-full bg-brand-blue hover:bg-brand-light-blue text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md mt-6">
          Submit Registration
        </button>
      </form>
      
      <p class="text-center text-sm text-gray-600 mt-8">
        Already have an account? 
        <a href="#" @click.prevent="router.push('/')" class="text-brand-blue font-bold hover:underline">Sign in here</a>
      </p>
    </div>
  </div>
</template>
