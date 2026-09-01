<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import AdminSidebar from '../components/AdminSidebar.vue'
import { useToast } from '../composables/useToast'

const toast = useToast()

const router = useRouter()
const defaultLimit = ref(10)
const isUpdating = ref(false)
const dateLimits = ref([])
const newException = ref({ date: '', limit: 0, reason: '' })
const badgeCounts = ref({ pending: 0, ready: 0, residentApprovals: 0 })

const fetchData = async () => {
  try {
    const [defaultRes, dateRes] = await Promise.all([
      axios.get('http://localhost:5000/api/settings/daily-limit'),
      axios.get('http://localhost:5000/api/settings/date-limits')
    ])
    if (defaultRes.data && defaultRes.data.limit !== undefined) {
      defaultLimit.value = defaultRes.data.limit
    }
    dateLimits.value = dateRes.data || []
  } catch (err) {
    console.error("Error fetching settings", err)
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
  const role = localStorage.getItem('role')
  if (role !== 'Admin') {
    router.push('/')
    return
  }
  fetchData()
  fetchCounts()
  setInterval(fetchCounts, 5000)
})

const handleUpdateDefault = async () => {
  isUpdating.value = true
  try {
    const adminId = localStorage.getItem('userId')
    await axios.put('http://localhost:5000/api/settings/daily-limit', { limit: defaultLimit.value, adminId })
    toast.success('Default limit updated successfully!')
  } catch (err) {
    toast.error('Failed to update default limit.')
  } finally {
    isUpdating.value = false
  }
}

const handleAddException = async () => {
  try {
    const adminId = localStorage.getItem('userId')
    await axios.post('http://localhost:5000/api/settings/date-limits', { 
      ...newException.value,
      adminId
    })
    toast.success('Date exception added successfully!')
    newException.value = { date: '', limit: 0, reason: '' }
    fetchData()
  } catch (err) {
    toast.error('Failed to add date exception.')
  }
}

const handleDeleteException = async (id) => {
  if (!window.confirm("Are you sure you want to delete this exception?")) return
  try {
    const adminId = localStorage.getItem('userId')
    await axios.delete(`http://localhost:5000/api/settings/date-limits/${id}`, {
      data: { adminId }
    })
    toast.success('Exception removed successfully!')
    fetchData()
  } catch (err) {
    toast.error('Failed to delete exception.')
  }
}
</script>

<template>
  <div class="flex h-screen bg-brand-gray font-sans overflow-hidden">
    
    <AdminSidebar activeMenu="System Settings" :badgeCounts="badgeCounts" />

    <div class="flex-1 p-8 overflow-y-auto">
      <div class="mb-8">
        <h1 class="m-0 text-gray-900 text-3xl font-bold">System Settings</h1>
        <p class="text-gray-500 mt-1">Configure global rules and daily processing limits for the Barangay Fortune system.</p>
      </div>

      <div class="flex flex-col gap-8 max-w-3xl">

        <!-- Default Daily Limit -->
        <div class="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h3 class="m-0 mb-2.5 text-gray-800 flex items-center gap-2 text-xl font-bold">
            ⚙️ Default Daily Limit
          </h3>
          <p class="text-gray-500 text-sm mb-6 leading-relaxed">
            Set the default maximum number of documents the system can process per day.
            This applies to all standard days unless overridden by a date exception below.
          </p>

          <div class="p-3 mb-6 rounded-lg bg-red-50 text-red-700 text-sm font-semibold border border-red-200 flex items-center gap-2.5">
            <span>🚫</span> Sunday operations are automatically closed and hidden from residents.
          </div>

          <form @submit.prevent="handleUpdateDefault" class="flex items-end gap-4">
            <div class="flex-1">
              <label class="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Documents per Day (Default)</label>
              <input 
                type="number" 
                min="1"
                v-model="defaultLimit" 
                required 
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-lg font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <button 
              type="submit" 
              :disabled="isUpdating"
              class="px-6 py-3 bg-brand-blue hover:bg-brand-light-blue text-white font-bold rounded-lg transition-colors whitespace-nowrap disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {{ isUpdating ? 'Saving...' : 'Save Limit' }}
            </button>
          </form>
        </div>

        <!-- Date-Specific Exceptions -->
        <div class="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h3 class="m-0 mb-2.5 text-gray-800 flex items-center gap-2 text-xl font-bold">
            📅 Specific Date Exceptions
          </h3>
          <p class="text-gray-500 text-sm mb-6 leading-relaxed">
            Override the default limit for specific dates — such as holidays, half-days, or special events.
            Setting a limit to <strong>0</strong> means the system is closed for that date.
          </p>

          <div class="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
            <h4 class="m-0 mb-4 text-gray-700 text-sm font-bold uppercase">Add New Exception</h4>
            <form @submit.prevent="handleAddException" class="grid grid-cols-[1fr_1fr_2fr_auto] gap-3 items-end">
              <div>
                <label class="block text-[11px] font-bold text-gray-500 mb-1">DATE</label>
                <input 
                  type="date" 
                  v-model="newException.date"
                  required
                  class="w-full p-2 rounded-md border border-gray-300 outline-none focus:ring-2 focus:ring-brand-blue text-sm"
                />
              </div>
              <div>
                <label class="block text-[11px] font-bold text-gray-500 mb-1">LIMIT (0 = CLOSED)</label>
                <input 
                  type="number" 
                  min="0"
                  v-model="newException.limit"
                  required
                  class="w-full p-2 rounded-md border border-gray-300 outline-none focus:ring-2 focus:ring-brand-blue text-sm font-bold"
                />
              </div>
              <div>
                <label class="block text-[11px] font-bold text-gray-500 mb-1">REASON</label>
                <input 
                  type="text" 
                  v-model="newException.reason"
                  required
                  placeholder="e.g. Holiday, Half-Day"
                  class="w-full p-2 rounded-md border border-gray-300 outline-none focus:ring-2 focus:ring-brand-blue text-sm"
                />
              </div>
              <button type="submit" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-md transition-colors whitespace-nowrap text-sm">
                + Add
              </button>
            </form>
          </div>

          <div class="overflow-x-auto rounded-lg border border-gray-200">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 border-b-2 border-gray-200">
                  <th class="py-3 px-4 text-gray-500 text-xs font-bold uppercase">Date</th>
                  <th class="py-3 px-4 text-gray-500 text-xs font-bold uppercase">Limit</th>
                  <th class="py-3 px-4 text-gray-500 text-xs font-bold uppercase">Reason</th>
                  <th class="py-3 px-4 text-gray-500 text-xs font-bold uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="dateLimits.length === 0">
                  <td colspan="4" class="p-8 text-center text-gray-400 text-sm">No date exceptions configured.</td>
                </tr>
                <tr v-for="item in dateLimits" :key="item.id" class="border-b border-gray-50 hover:bg-gray-50">
                  <td class="py-3.5 px-4 font-bold text-gray-800 text-sm">
                    {{ new Date(item.specific_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) }}
                  </td>
                  <td class="py-3.5 px-4 text-sm">
                    <span v-if="item.document_limit === 0" class="bg-red-50 text-red-700 px-2.5 py-1 rounded-md font-bold text-xs border border-red-100">CLOSED (0)</span>
                    <span v-else class="font-bold text-gray-800">{{ item.document_limit }}</span>
                  </td>
                  <td class="py-3.5 px-4 text-gray-600 text-sm">{{ item.reason }}</td>
                  <td class="py-3.5 px-4">
                    <button 
                      @click="handleDeleteException(item.id)"
                      class="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md font-bold text-xs hover:bg-red-100 transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
