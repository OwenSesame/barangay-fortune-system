<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import AdminSidebar from '../components/AdminSidebar.vue'
import ReceiptModal from '../components/ReceiptModal.vue'
import { useToast } from '../composables/useToast'

const logs = ref([])
const searchTerm = ref('')
const dateFilter = ref('')
const badgeCounts = ref({ pending: 0, ready: 0, residentApprovals: 0 })
const showReceipt = ref(false)
const receiptRequestId = ref(null)
const toast = useToast()

const fetchLogs = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/admin/audit-logs')
    logs.value = response.data
  } catch (error) {
    console.error("Failed to fetch logs", error)
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
  fetchLogs()
  fetchCounts()
  const interval = setInterval(fetchCounts, 5000)
  return () => clearInterval(interval)
})

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    const matchesSearch = 
      log.action_type.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      (log.user_name && log.user_name.toLowerCase().includes(searchTerm.value.toLowerCase()))
    
    const matchesDate = dateFilter.value === '' || log.timestamp.startsWith(dateFilter.value)
    
    return matchesSearch && matchesDate
  })
})

const exportToCSV = () => {
  if (filteredLogs.value.length === 0) {
    toast.error("No logs to export.")
    return
  }
  let csvContent = "data:text/csv;charset=utf-8,"
  csvContent += "Timestamp,User,Action,Details\n"
  filteredLogs.value.forEach(log => {
    const date = new Date(log.timestamp).toLocaleString().replace(/,/g, '')
    const user = log.user_name || 'System Admin'
    const action = log.action_type
    const details = log.details.replace(/,/g, ';')
    csvContent += `${date},${user},${action},${details}\n`
  })
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", "System_Audit_Logs.csv")
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const openReceipt = (details) => {
  const match = details.match(/Request #(\d+)/)
  if (match && match[1]) {
    receiptRequestId.value = match[1]
    showReceipt.value = true
  }
}
</script>

<template>
  <div class="flex h-screen bg-brand-gray font-sans overflow-hidden">
    
    <AdminSidebar activeMenu="Audit Logs" :badgeCounts="badgeCounts" />

    <div class="flex-1 p-8 overflow-y-auto">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h1 class="text-[#0f172a] m-0 text-3xl font-bold">System Audit Logs</h1>
          <p class="text-[#64748b] mb-8 mt-1">Tracking every administrative action and system change.</p>
        </div>
        <button @click="exportToCSV" class="self-end px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition whitespace-nowrap shadow-sm">
          📥 Export CSV
        </button>
      </div>

      <!-- Filters -->
      <div class="flex gap-5 mb-5 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div class="flex-[2]">
          <label class="block text-xs font-bold text-gray-500 mb-1">SEARCH ACTIONS OR USERS</label>
          <input 
            type="text" 
            placeholder="e.g. Privilege Change, Update, or Staff Name..." 
            v-model="searchTerm"
            class="w-full p-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-brand-blue"
          />
        </div>
        <div class="flex-1">
          <label class="block text-xs font-bold text-gray-500 mb-1">FILTER BY DATE</label>
          <input 
            type="date" 
            v-model="dateFilter"
            class="w-full p-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-brand-blue"
          />
        </div>
        <button @click="() => { searchTerm = ''; dateFilter = ''; }" class="self-end px-5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium text-gray-600">
          Reset
        </button>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-left border-collapse table-fixed">
          <colgroup>
            <col class="w-[180px]" />
            <col class="w-[160px]" />
            <col class="w-[160px]" />
            <col />
          </colgroup>
          <thead>
            <tr class="bg-gray-50 border-b-2 border-gray-200">
              <th class="py-4 px-5 text-gray-500 text-xs font-bold">TIMESTAMP</th>
              <th class="py-4 px-5 text-gray-500 text-xs font-bold">USER</th>
              <th class="py-4 px-5 text-gray-500 text-xs font-bold">ACTION</th>
              <th class="py-4 px-5 text-gray-500 text-xs font-bold">DETAILS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in filteredLogs" :key="log.log_id" class="border-b border-gray-50 hover:bg-gray-50/50">
              <td class="py-4 px-5 align-top">
                <span class="block font-semibold text-gray-700">
                  {{ new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
                </span>
                <span class="text-xs text-gray-400">
                  {{ new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </td>
              <td class="py-4 px-5 align-top font-bold text-sm text-gray-800">
                {{ log.user_name || 'System Admin' }}
              </td>
              <td class="py-4 px-5 align-top">
                <span :class="[
                  'px-2.5 py-1 rounded-[4px] text-[11px] font-bold whitespace-nowrap',
                  log.action_type === 'Privilege Change' ? 'bg-amber-100 text-amber-800' :
                  log.action_type === 'Login' || log.action_type === 'Logout' ? 'bg-gray-100 text-gray-600' :
                  'bg-indigo-100 text-indigo-800'
                ]">
                  {{ log.action_type }}
                </span>
              </td>
              <td class="py-4 px-5 align-top text-gray-600 text-sm leading-relaxed break-words">
                {{ log.details }}
                <div v-if="log.details.includes('OR #')" class="mt-2.5">
                  <button 
                    @click="openReceipt(log.details)"
                    class="px-3 py-1.5 bg-blue-500 text-white border-none rounded cursor-pointer text-[11px] font-bold hover:bg-blue-600 transition"
                  >
                    👁️ View Receipt Slip
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredLogs.length === 0">
              <td colspan="4" class="p-10 text-center text-gray-400 font-medium">No logs match your search criteria.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ReceiptModal 
      :isOpen="showReceipt"
      @close="showReceipt = false"
      :requestId="receiptRequestId"
      mode="audit"
    />
  </div>
</template>
