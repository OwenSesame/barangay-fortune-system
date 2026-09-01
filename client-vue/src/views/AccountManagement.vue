<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import AdminSidebar from '../components/AdminSidebar.vue'
import { useToast } from '../composables/useToast'

const toast = useToast()
const route = useRoute()
const activeTab = ref(route.query.tab === 'residents' ? 'Residents' : 'Staff')
const staffList = ref([])
const residentList = ref([])
const badgeCounts = ref({ pending: 0, ready: 0, residentApprovals: 0 })
const isAddStaffOpen = ref(false)
const newStaff = ref({ full_name: '', username: '', password: '', email_address: '' })

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*'
  let pwd = ''
  for(let i=0; i<12; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  newStaff.value.password = pwd
}

const editModal = ref({
  isOpen: false, id: null, type: '',
  full_name: '', username: '',
  first_name: '', last_name: '', contact_number: '', email_address: ''
})

let interval = null

const fetchData = async () => {
  try {
    const staffRes = await axios.get('http://localhost:5000/api/admin/staff-list')
    const accountsRes = await axios.get('http://localhost:5000/api/admin/accounts')
    
    const officialsOnly = accountsRes.data.filter(acc => acc.account_type === 'official' && acc.role === 'Staff')
    const residentsOnly = accountsRes.data.filter(acc => acc.account_type === 'resident')
    
    const mergedStaff = officialsOnly.map(official => {
      const toggleData = staffRes.data.find(s => s.user_id === official.id)
      return { ...official, can_review: toggleData ? toggleData.can_review : 0 }
    })

    staffList.value = mergedStaff
    residentList.value = residentsOnly
  } catch (error) {
    console.error("Failed to fetch accounts", error)
  }
}

const fetchCounts = async () => {
  try {
    const [requestsRes, residentsRes] = await Promise.all([
      axios.get('http://localhost:5000/api/staff/pending-requests'),
      axios.get('http://localhost:5000/api/admin/pending-residents')
    ])
    const pending = requestsRes.data.filter(req => req.status === 'Pending').length
    const ready = requestsRes.data.filter(req => req.status === 'Ready to Print').length
    const residentApprovals = residentsRes.data.length
    badgeCounts.value = { pending, ready, residentApprovals }
  } catch (error) {
    console.error("Failed to fetch notification counts", error)
  }
}

onMounted(() => {
  fetchData()
  fetchCounts()
  interval = setInterval(fetchCounts, 5000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

const handleAddStaff = async () => {
  try {
    await axios.post('http://localhost:5000/api/admin/create-staff', newStaff.value)
    isAddStaffOpen.value = false
    newStaff.value = { full_name: '', username: '', password: '', email_address: '' }
    fetchData()
    toast.success("New Staff Account Successfully Created!")
  } catch (error) {
    toast.error("Error creating staff account. Username might be taken.")
  }
}

const handleUpdateAccount = async () => {
  try {
    await axios.put('http://localhost:5000/api/admin/accounts/update', {
      id: editModal.value.id,
      account_type: editModal.value.type,
      full_name: editModal.value.full_name,
      username: editModal.value.username,
      first_name: editModal.value.first_name,
      last_name: editModal.value.last_name,
      contact_number: editModal.value.contact_number,
      email_address: editModal.value.email_address
    })
    closeEditModal()
    fetchData()
    toast.success("Account information updated successfully!")
  } catch (error) {
    toast.error("Error updating account details.")
  }
}

const handleToggleAccess = async (staffId, currentAccess) => {
  try {
    const newAccess = currentAccess === 1 ? 0 : 1
    await axios.put(`http://localhost:5000/api/admin/staff/${staffId}/toggle-access`, { can_review: newAccess })
    fetchData()
  } catch (error) {
    toast.error("Error updating permissions.")
  }
}

const handleToggleStaffStatus = async (staffId, currentStatus) => {
  try {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active'
    if (newStatus === 'Suspended' && !window.confirm("Are you sure you want to suspend this staff account? They will not be able to log in.")) return
    await axios.put(`http://localhost:5000/api/admin/staff/${staffId}/toggle-status`, { status: newStatus })
    fetchData()
    toast.success(`Staff account marked as ${newStatus}.`)
  } catch (error) {
    toast.error("Error updating account status.")
  }
}

const handleToggleCaptain = async (staffId, isCaptain) => {
  if (isCaptain) return
  if (!window.confirm("Are you sure you want to assign this staff member as the new Barangay Captain? This will replace the current captain.")) return
  try {
    await axios.put(`http://localhost:5000/api/admin/staff/${staffId}/toggle-captain`)
    fetchData()
    toast.success("Barangay Captain updated successfully!")
  } catch (error) {
    toast.error("Error updating Barangay Captain.")
  }
}

const handleDeleteAccount = async (id, type) => {
  if (!window.confirm(`WARNING: Are you sure you want to permanently delete this ${type} account?`)) return
  try {
    await axios.put('http://localhost:5000/api/admin/accounts/archive', { id, account_type: type })
    fetchData()
    toast.success("Account deleted successfully.")
  } catch (error) {
    toast.error("Cannot delete account. They may have active records.")
  }
}

const openEditModal = (user) => {
  editModal.value = {
    isOpen: true,
    id: user.id,
    type: user.account_type,
    full_name: user.full_name || '',
    username: user.username || '',
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    contact_number: user.contact_number || '',
    email_address: user.email_address || ''
  }
}

const closeEditModal = () => {
  editModal.value = {
    isOpen: false, id: null, type: '',
    full_name: '', username: '',
    first_name: '', last_name: '', contact_number: '', email_address: ''
  }
}
</script>

<template>
  <div class="flex h-screen bg-brand-gray font-sans overflow-hidden">
    
    <AdminSidebar activeMenu="Account Management" :badgeCounts="badgeCounts" />

    <div class="flex-1 p-8 overflow-y-auto">
      <div class="flex justify-between items-start mb-8">
        <div>
          <h1 class="m-0 text-gray-900 text-3xl font-bold tracking-tight">Account Management</h1>
          <p class="text-gray-500 mt-1">Control system access, update profiles, and manage permissions.</p>
        </div>
        <button 
          v-if="activeTab === 'Staff'"
          @click="isAddStaffOpen = true"
          class="px-6 py-3 bg-brand-blue hover:bg-brand-light-blue text-white rounded-lg font-bold shadow-md transition-colors text-sm"
        >
          + Add Front Desk Staff
        </button>
      </div>

      <div class="flex gap-2 mb-6 bg-gray-200 p-1.5 rounded-full w-max">
        <button 
          @click="activeTab = 'Staff'" 
          :class="['px-6 py-2.5 rounded-full font-bold text-sm transition-all outline-none', activeTab === 'Staff' ? 'bg-brand-blue text-white shadow-sm' : 'bg-transparent text-gray-500 hover:bg-gray-300 hover:text-gray-700']"
        >
          👨‍💼 Front Desk Team
        </button>
        <button 
          @click="activeTab = 'Residents'" 
          :class="['px-6 py-2.5 rounded-full font-bold text-sm transition-all outline-none', activeTab === 'Residents' ? 'bg-brand-blue text-white shadow-sm' : 'bg-transparent text-gray-500 hover:bg-gray-300 hover:text-gray-700']"
        >
          🏘️ Registered Residents
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead class="bg-gray-50">
            <tr>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">Profile Name</th>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">System Role</th>
              <th v-if="activeTab === 'Staff'" class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">Pending Review Access</th>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200 text-right">Management Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="activeTab === 'Staff'">
              <tr v-for="staff in staffList" :key="staff.id" class="border-b border-gray-50 hover:bg-gray-50">
                <td class="py-4 px-6 align-middle">
                  <div class="font-bold text-gray-900 text-sm">{{ staff.name }}</div>
                  <div class="text-gray-500 text-xs mt-1">@{{ staff.username }}</div>
                </td>
                <td class="py-4 px-6 align-middle">
                  <span :class="['px-3 py-1.5 rounded-full text-xs font-bold border', staff.is_captain === 1 ? 'bg-yellow-50 text-yellow-800 border-yellow-300' : 'bg-gray-100 text-gray-600 border-gray-300']">
                    {{ staff.is_captain === 1 ? '👑 Brgy. Captain' : 'Front Desk Staff' }}
                  </span>
                </td>
                <td class="py-4 px-6 align-middle">
                  <button 
                    @click="handleToggleAccess(staff.id, staff.can_review)" 
                    :class="['px-4 py-2 rounded-full border-none cursor-pointer text-xs font-bold transition-colors', staff.can_review === 1 ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200']"
                  >
                    {{ staff.can_review === 1 ? '🟢 Access Granted' : '🔒 Access Revoked' }}
                  </button>
                </td>
                <td class="py-4 px-6 align-middle text-right">
                  <div class="flex gap-2 justify-end">
                    <button v-if="staff.is_captain === 0" @click="handleToggleCaptain(staff.id, staff.is_captain)" class="px-4 py-2 rounded-lg text-xs font-bold bg-yellow-50 text-yellow-800 border border-yellow-300 hover:bg-yellow-100 transition-colors">
                      Make Captain
                    </button>
                    <button 
                      @click="handleToggleStaffStatus(staff.id, staff.account_status)" 
                      :class="['px-4 py-2 rounded-lg text-xs font-bold border transition-colors', staff.account_status === 'Active' ? 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100' : 'bg-emerald-500 text-white hover:bg-emerald-600']"
                    >
                      {{ staff.account_status === 'Active' ? 'Suspend' : 'Activate' }}
                    </button>
                    <button @click="openEditModal(staff)" class="px-4 py-2 rounded-lg text-xs font-bold bg-gray-50 text-brand-blue border border-gray-300 hover:bg-blue-50 transition-colors">Edit</button>
                    <button @click="handleDeleteAccount(staff.id, 'official')" class="px-4 py-2 rounded-lg text-xs font-bold bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-colors">Delete</button>
                  </div>
                </td>
              </tr>
              <tr v-if="staffList.length === 0">
                <td colspan="4" class="p-12 text-center text-gray-400 text-sm font-medium">No staff members found.</td>
              </tr>
            </template>

            <template v-else>
              <tr v-for="res in residentList" :key="res.id" class="border-b border-gray-50 hover:bg-gray-50">
                <td class="py-4 px-6 align-middle">
                  <div class="font-bold text-gray-900 text-sm">{{ res.first_name }} {{ res.last_name }}</div>
                  <div class="text-gray-500 text-xs mt-1">{{ res.email_address }} | {{ res.contact_number }}</div>
                </td>
                <td class="py-4 px-6 align-middle">
                  <span class="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-200">Resident</span>
                </td>
                <td class="py-4 px-6 align-middle text-right">
                  <div class="flex gap-2 justify-end">
                    <button @click="openEditModal(res)" class="px-4 py-2 rounded-lg text-xs font-bold bg-gray-50 text-brand-blue border border-gray-300 hover:bg-blue-50 transition-colors">Edit Profile</button>
                    <button @click="handleDeleteAccount(res.id, 'resident')" class="px-4 py-2 rounded-lg text-xs font-bold bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-colors">Remove</button>
                  </div>
                </td>
              </tr>
              <tr v-if="residentList.length === 0">
                <td colspan="3" class="p-12 text-center text-gray-400 text-sm font-medium">No registered residents found.</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ADD NEW STAFF MODAL -->
    <div v-if="isAddStaffOpen" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[1000]">
      <div class="bg-white p-10 rounded-2xl w-[420px] shadow-2xl">
        <h2 class="m-0 mb-6 text-gray-900 text-2xl font-bold">Register New Staff</h2>
        <form @submit.prevent="handleAddStaff" class="flex flex-col gap-5">
          <div>
            <label class="block mb-2 text-sm text-gray-600 font-bold uppercase tracking-wide">Full Name</label>
            <input type="text" v-model="newStaff.full_name" required class="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors" />
          </div>
          <div>
            <label class="block mb-2 text-sm text-gray-600 font-bold uppercase tracking-wide">Username</label>
            <input type="text" v-model="newStaff.username" required class="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors" />
          </div>
          <div>
            <label class="block mb-2 text-sm text-gray-600 font-bold uppercase tracking-wide">Password</label>
            <div class="flex gap-2">
              <input type="text" v-model="newStaff.password" required class="flex-1 p-3 rounded-lg border border-gray-300 bg-gray-50 outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors font-mono" />
              <button type="button" @click="generatePassword" class="px-4 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors text-xs border-none cursor-pointer border border-gray-300">
                Generate
              </button>
            </div>
          </div>
          <div>
            <label class="block mb-2 text-sm text-gray-600 font-bold uppercase tracking-wide">Email Address <span class="lowercase text-gray-400 font-normal">(optional)</span></label>
            <input type="email" v-model="newStaff.email_address" class="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors" />
          </div>
          <div class="flex gap-3 mt-2">
            <button type="button" @click="isAddStaffOpen = false" class="flex-1 p-3 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition-colors">Cancel</button>
            <button type="submit" class="flex-1 p-3 bg-brand-blue text-white rounded-lg font-bold hover:bg-brand-light-blue transition-colors">Create</button>
          </div>
        </form>
      </div>
    </div>

    <!-- DYNAMIC EDIT ACCOUNT MODAL -->
    <div v-if="editModal.isOpen" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[1000]">
      <div class="bg-white p-10 rounded-2xl w-[480px] shadow-2xl">
        <div class="flex items-center gap-3 mb-6">
          <span class="text-2xl">✏️</span>
          <h2 class="m-0 text-gray-900 text-2xl font-bold">Edit {{ editModal.type === 'official' ? 'Staff' : 'Resident' }} Profile</h2>
        </div>
        
        <form @submit.prevent="handleUpdateAccount" class="flex flex-col gap-4">
          
          <template v-if="editModal.type === 'official'">
            <div>
              <label class="block mb-2 text-xs text-gray-500 font-bold uppercase tracking-wide">Full Name</label>
              <input type="text" v-model="editModal.full_name" required class="w-full p-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-brand-blue text-sm" />
            </div>
            <div>
              <label class="block mb-2 text-xs text-gray-500 font-bold uppercase tracking-wide">Username</label>
              <input type="text" v-model="editModal.username" required class="w-full p-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-brand-blue text-sm" />
            </div>
          </template>

          <template v-if="editModal.type === 'resident'">
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="block mb-2 text-xs text-gray-500 font-bold uppercase tracking-wide">First Name</label>
                <input type="text" v-model="editModal.first_name" required class="w-full p-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-brand-blue text-sm" />
              </div>
              <div class="flex-1">
                <label class="block mb-2 text-xs text-gray-500 font-bold uppercase tracking-wide">Last Name</label>
                <input type="text" v-model="editModal.last_name" required class="w-full p-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-brand-blue text-sm" />
              </div>
            </div>
            <div>
              <label class="block mb-2 text-xs text-gray-500 font-bold uppercase tracking-wide">Contact Number</label>
              <input type="text" v-model="editModal.contact_number" required class="w-full p-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-brand-blue text-sm" />
            </div>
            <div>
              <label class="block mb-2 text-xs text-gray-500 font-bold uppercase tracking-wide">Email Address</label>
              <input type="email" v-model="editModal.email_address" required class="w-full p-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-brand-blue text-sm" />
            </div>
          </template>
          
          <div class="flex gap-3 mt-4">
            <button type="button" @click="closeEditModal" class="flex-1 p-3 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition-colors text-sm">Cancel</button>
            <button type="submit" class="flex-1 p-3 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-colors text-sm shadow-sm">Save Changes</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>
