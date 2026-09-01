<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import ResidentSidebar from '../components/ResidentSidebar.vue'
import ResidentBottomNav from '../components/ResidentBottomNav.vue'
import { useToast } from '../composables/useToast'

const router = useRouter()
const toast = useToast()

const profile = ref({
  first_name: '', last_name: '', email_address: '', 
  contact_number: '', addres_street: '', civil_status: ''
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

onMounted(async () => {
  try {
    const myId = localStorage.getItem('userId')
    if (!myId) return router.push('/')

    const response = await axios.get(`http://localhost:5000/api/auth/profile/${myId}`)
    profile.value = response.data
  } catch (error) {
    console.error("Failed to load profile", error)
  }
})

const handleUpdate = async () => {
  try {
    const myId = localStorage.getItem('userId')
    await axios.put(`http://localhost:5000/api/auth/profile/update/${myId}`, {
      contact_number: profile.value.contact_number,
      addres_street: profile.value.addres_street
    })
    toast.success("Profile updated successfully!")
  } catch (error) {
    toast.error("Failed to update profile.")
  }
}

const handlePasswordChange = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    return toast.error("New passwords do not match!")
  }
  
  try {
    const myId = localStorage.getItem('userId')
    const response = await axios.put(`http://localhost:5000/api/auth/profile/change-password/${myId}`, {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    })
    toast.success(response.data.message || "Password updated successfully!")
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      toast.error(error.response.data.error)
    } else {
      toast.error("Failed to update password.")
    }
  }
}
</script>

<template>
  <div class="flex flex-col md:flex-row min-h-screen bg-brand-gray font-sans pb-[65px] md:pb-0">
    
    <ResidentSidebar activeMenu="Profile Settings" />

    <div class="flex-1 p-5 md:p-10 flex justify-center overflow-y-auto w-full overflow-x-hidden">
      <div class="bg-white p-10 rounded-2xl shadow-sm border border-gray-200 w-full max-w-[600px] h-fit mb-10">
        
        <h2 class="m-0 mb-2 text-gray-900 text-2xl font-bold tracking-tight">Account Profile</h2>
        <p class="text-gray-500 mb-8 mt-0 text-sm">Keep your contact information up to date so the Barangay can reach you.</p>
        
        <!-- Read-Only Official Information -->
        <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 relative">
          <div class="flex justify-between items-center mb-5">
            <h4 class="m-0 text-gray-600 uppercase text-xs font-bold tracking-wide">Official Records (Uneditable)</h4>
            <div class="group relative">
              <span class="cursor-help text-gray-400 hover:text-brand-blue transition-colors">ℹ️ Why can't I edit these?</span>
              <div class="hidden group-hover:block absolute right-0 top-6 w-64 bg-gray-900 text-white text-xs p-3 rounded-lg shadow-xl z-10">
                To prevent identity fraud, core personal details cannot be changed online. If you have married or legally changed your name, please visit the Barangay Hall with your supporting documents.
              </div>
            </div>
          </div>
          <div class="flex flex-col md:grid md:grid-cols-2 gap-5">
            <div>
              <label class="text-xs text-gray-500 font-bold tracking-wide">Full Name</label>
              <div class="font-bold text-gray-900 mt-1">{{ profile.first_name }} {{ profile.last_name }}</div>
            </div>
            <div>
              <label class="text-xs text-gray-500 font-bold tracking-wide">Civil Status</label>
              <div class="font-bold text-gray-900 mt-1">{{ profile.civil_status }}</div>
            </div>
            <div class="md:col-span-2">
              <label class="text-xs text-gray-500 font-bold tracking-wide">Registered Email</label>
              <div class="break-all font-bold text-gray-900 mt-1">{{ profile.email_address }}</div>
            </div>
          </div>
        </div>

        <!-- Editable Form -->
        <form @submit.prevent="handleUpdate" class="flex flex-col gap-5 mb-10">
          <div>
            <label class="block mb-2 text-gray-700 font-bold text-sm">Contact Number</label>
            <input 
              type="text" 
              v-model="profile.contact_number" 
              class="w-full p-3 rounded-lg border border-gray-300 text-base outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label class="block mb-2 text-gray-700 font-bold text-sm">Complete Address</label>
            <input 
              type="text" 
              v-model="profile.addres_street" 
              class="w-full p-3 rounded-lg border border-gray-300 text-base outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <button type="submit" class="w-full p-4 bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-lg text-base font-bold cursor-pointer mt-2 transition-colors shadow-sm">
            💾 Save Updates
          </button>
        </form>

        <!-- Change Password Form -->
        <h3 class="m-0 mb-5 text-gray-900 border-t border-gray-200 pt-8 text-xl font-bold tracking-tight">Change Password</h3>
        <form @submit.prevent="handlePasswordChange" class="flex flex-col gap-5">
          <div>
            <label class="block mb-2 text-gray-700 font-bold text-sm">Current Password</label>
            <input 
              type="password" 
              v-model="passwordForm.currentPassword" 
              required
              class="w-full p-3 rounded-lg border border-gray-300 text-base outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label class="block mb-2 text-gray-700 font-bold text-sm">New Password</label>
            <input 
              type="password" 
              v-model="passwordForm.newPassword" 
              required
              class="w-full p-3 rounded-lg border border-gray-300 text-base outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label class="block mb-2 text-gray-700 font-bold text-sm">Confirm New Password</label>
            <input 
              type="password" 
              v-model="passwordForm.confirmPassword" 
              required
              class="w-full p-3 rounded-lg border border-gray-300 text-base outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <button type="submit" class="w-full p-4 bg-brand-blue hover:bg-brand-light-blue text-white border-none rounded-lg text-base font-bold cursor-pointer mt-2 transition-colors shadow-sm">
            🔒 Update Password
          </button>
        </form>

      </div>
    </div>

    <ResidentBottomNav />
  </div>
</template>
