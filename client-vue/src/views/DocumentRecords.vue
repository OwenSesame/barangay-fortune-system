<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import StaffSidebar from '../components/StaffSidebar.vue'
import ReceiptModal from '../components/ReceiptModal.vue'

const records = ref([])
const searchTerm = ref('')
const counts = ref({ pending: 0, ready: 0 })
const canReview = ref(false)

const showReceipt = ref(false)
const receiptRequestId = ref(null)

let interval = null

const fetchDataAndSync = async () => {
  const staffId = localStorage.getItem('userId')
  if (!staffId) return
  
  try {
    const profileRes = await axios.get(`http://localhost:5000/api/staff/profile/${staffId}`)
    const currentPermission = Number(profileRes.data.can_review) === 1
    canReview.value = currentPermission
    localStorage.setItem('canReview', profileRes.data.can_review)

    const recordsRes = await axios.get('http://localhost:5000/api/staff/document-records')
    records.value = recordsRes.data

    const requestsRes = await axios.get('http://localhost:5000/api/staff/pending-requests')
    counts.value = {
      pending: requestsRes.data.filter(req => req.status === 'Pending').length,
      ready: requestsRes.data.filter(req => req.status === 'Ready to Print').length
    }
  } catch (error) {
    console.error("Failed to fetch data", error)
  }
}

onMounted(() => {
  canReview.value = localStorage.getItem('canReview') === '1'
  fetchDataAndSync()
  interval = setInterval(fetchDataAndSync, 5000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

const filteredRecords = computed(() => {
  if (!searchTerm.value) return records.value
  const term = searchTerm.value.toLowerCase()
  return records.value.filter(rec => 
    (rec.first_name?.toLowerCase().includes(term)) ||
    (rec.last_name?.toLowerCase().includes(term)) ||
    (rec.doc_name?.toLowerCase().includes(term)) ||
    (rec.request_id?.toString().includes(term)) ||
    (rec.or_number?.toLowerCase().includes(term))
  )
})

const openReceipt = (requestId) => {
  receiptRequestId.value = requestId
  showReceipt.value = true
}
</script>

<template>
  <div class="flex h-screen bg-brand-gray font-sans overflow-hidden">
    
    <StaffSidebar activeMenu="Document Records" :counts="counts" :canReview="canReview" />

    <div class="flex-1 p-8 overflow-y-auto">
      <div class="mb-8">
        <h1 class="m-0 text-gray-900 text-3xl font-bold tracking-tight">Transaction History</h1>
        <p class="text-gray-500 mt-1">Search and view all completed or rejected document requests.</p>
      </div>

      <div class="bg-white p-5 rounded-xl mb-6 shadow-sm border border-gray-100">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
            </svg>
          </div>
          <input 
            type="text" 
            v-model="searchTerm"
            placeholder="Search by resident name, document type, OR number..." 
            class="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors text-sm"
          />
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead class="bg-gray-50">
            <tr>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">Date</th>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">Resident</th>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">Document Type</th>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">Status</th>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">OR Number</th>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">Processed By</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rec in filteredRecords" :key="rec.request_id" class="border-b border-gray-50 hover:bg-gray-50">
              <td class="py-4 px-6 text-gray-500 text-sm">
                {{ new Date(rec.date_requested).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
              </td>
              <td class="py-4 px-6 font-bold text-gray-900 text-sm">{{ rec.first_name }} {{ rec.last_name }}</td>
              <td class="py-4 px-6 font-semibold text-brand-blue text-sm">{{ rec.doc_name }}</td>
              <td class="py-4 px-6">
                <span :class="['px-3 py-1.5 rounded-full text-xs font-bold border', rec.status === 'Released' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200']">
                  {{ rec.status }}
                </span>
              </td>
              <td class="py-4 px-6">
                <button 
                  v-if="rec.or_number"
                  @click="openReceipt(rec.request_id)"
                  class="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded font-bold text-xs hover:bg-green-100 transition-colors flex items-center gap-1"
                  title="Click to view receipt"
                >
                  📄 {{ rec.or_number }}
                </button>
                <span v-else class="text-gray-400 font-bold">-</span>
              </td>
              <td class="py-4 px-6 text-gray-500 text-xs font-mono bg-gray-50/50">
                #{{ rec.processed_by || 'N/A' }}
              </td>
            </tr>
            <tr v-if="filteredRecords.length === 0">
              <td colspan="6" class="p-12 text-center text-gray-400 text-sm font-medium">No records found matching your search.</td>
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
