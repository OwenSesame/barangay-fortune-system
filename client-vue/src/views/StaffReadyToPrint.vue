<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import StaffSidebar from '../components/StaffSidebar.vue'
import AdminSidebar from '../components/AdminSidebar.vue'
import ReceiptModal from '../components/ReceiptModal.vue'
import ConfirmModal from '../components/Modals/ConfirmModal.vue'
import { useToast } from '../composables/useToast'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const userRole = ref(localStorage.getItem('role') || 'Staff')
const canReview = ref(false)
const readyRequests = ref([])
const counts = ref({ pending: 0, ready: 0 })
const badgeCounts = ref({ pending: 0, ready: 0, residentApprovals: 0 })

// Search & Filter
const searchQuery = ref('')
const filterTab = ref('All')

const showPaymentModal = ref(false)
const selectedPaymentReq = ref(null)
const paymentOrInput = ref('')
const amountTendered = ref('')
const isProcessingPayment = ref(false)

const showValidateModal = ref(false)
const selectedReleaseReq = ref(null)
const validateOrInput = ref('')

const showReceiptPreview = ref(false)
const previewRequestId = ref(null)
const previewOrNumber = ref('')

const showReleaseConfirm = ref(false)

let interval = null

const createRandomORCode = () => {
  const randomHex = Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase().padStart(6, '0')
  return `OR-${randomHex}`
}

const fetchRequestsAndSync = async () => {
  const staffId = localStorage.getItem('userId')
  if (!staffId) return

  try {
    const profileRes = await axios.get(`http://localhost:5000/api/staff/profile/${staffId}`)
    const currentPermission = Number(profileRes.data.can_review) === 1
    canReview.value = currentPermission
    localStorage.setItem('canReview', profileRes.data.can_review)

    const response = await axios.get('http://localhost:5000/api/staff/pending-requests')
    readyRequests.value = response.data.filter(req => 
      ['Waiting for Printing', 'Ready to Print', 'Ready for Pickup'].includes(req.status)
    )
    
    counts.value = {
      pending: response.data.filter(req => req.status === 'Pending').length,
      ready: readyRequests.value.length
    }
  } catch (error) {
    console.error("Failed to fetch requests", error)
  }
}

onMounted(() => {
  canReview.value = localStorage.getItem('canReview') === '1'
  fetchRequestsAndSync()
  interval = setInterval(fetchRequestsAndSync, 5000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

const filteredRequests = computed(() => {
  let result = readyRequests.value
  
  if (filterTab.value === 'Printing') {
    result = result.filter(r => r.status === 'Waiting for Printing' || r.status === 'Ready to Print')
  } else if (filterTab.value === 'Unpaid') {
    result = result.filter(r => r.status === 'Ready for Pickup' && !r.or_number)
  } else if (filterTab.value === 'Ready') {
    result = result.filter(r => r.status === 'Ready for Pickup' && r.or_number)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(req => 
      `${req.first_name} ${req.last_name}`.toLowerCase().includes(q) ||
      req.daily_sequence_no?.toString().includes(q) ||
      req.or_number?.toLowerCase().includes(q) ||
      (req.requested_for_name && req.requested_for_name.toLowerCase().includes(q))
    )
  }
  return result
})

const handleOpenPaymentModal = (req) => {
  selectedPaymentReq.value = req
  paymentOrInput.value = createRandomORCode()
  amountTendered.value = ''
  showPaymentModal.value = true
}

const changeAmount = computed(() => {
  if (!selectedPaymentReq.value || !amountTendered.value) return 0
  const change = Number(amountTendered.value) - Number(selectedPaymentReq.value.base_fee || 0)
  return change > 0 ? change : 0
})

const handleConfirmPayment = async () => {
  const staffId = localStorage.getItem('userId')
  if (!paymentOrInput.value.trim()) {
    return toast.error("Please enter or generate an Official Receipt (OR) number.")
  }
  if (Number(amountTendered.value) < Number(selectedPaymentReq.value.base_fee || 0)) {
    return toast.error("Amount tendered is less than the fee!")
  }

  isProcessingPayment.value = true
  try {
    const res = await axios.put(`http://localhost:5000/api/staff/generate-or/${selectedPaymentReq.value.request_id}`, {
      official_id: staffId,
      orNumber: paymentOrInput.value.trim().toUpperCase()
    })
    toast.success(res.data.message || "Payment confirmed & OR generated!")
    showPaymentModal.value = false
    fetchRequestsAndSync()
  } catch (error) {
    console.error(error)
    const msg = error.response?.data?.error || "Error recording payment."
    toast.error(msg)
  } finally {
    isProcessingPayment.value = false
  }
}

const handleOpenReleaseModal = (req) => {
  selectedReleaseReq.value = req
  validateOrInput.value = ''
  showValidateModal.value = true
}

const handleValidateOR = () => {
  const cleanInput = validateOrInput.value.trim().toUpperCase()
  if (!cleanInput) {
    return toast.error("Please enter the Official Receipt (OR) Number from the resident's receipt.")
  }

  if (selectedReleaseReq.value.or_number && cleanInput !== selectedReleaseReq.value.or_number.toUpperCase()) {
    return toast.error(`Invalid OR Code. The code does not match the issued Official Receipt (${selectedReleaseReq.value.or_number}).`)
  }

  showValidateModal.value = false
  previewRequestId.value = selectedReleaseReq.value.request_id
  previewOrNumber.value = cleanInput
  showReceiptPreview.value = true
}

const triggerFinalRelease = () => {
  showReleaseConfirm.value = true
}

const handleFinalizeRelease = async () => {
  const staffId = localStorage.getItem('userId')
  try {
    await axios.put(`http://localhost:5000/api/staff/update-status/${previewRequestId.value}`, { 
        status: 'Released', 
        official_id: staffId,
        orNumber: previewOrNumber.value
    })
    showReleaseConfirm.value = false
    showReceiptPreview.value = false
    toast.success("Document successfully released and recorded in Audit Logs!")
    fetchRequestsAndSync()
  } catch (error) {
    console.error(error)
    const msg = error.response?.data?.error || error.response?.data?.message || "Error releasing document."
    toast.error(msg)
    showReleaseConfirm.value = false
  }
}

// Helper to auto-capitalize OR input
const enforceUppercaseOR = (e, targetRef) => {
  if (targetRef === 'payment') {
    paymentOrInput.value = paymentOrInput.value.toUpperCase()
  } else {
    validateOrInput.value = validateOrInput.value.toUpperCase()
  }
}
</script>

<template>
  <div class="flex h-screen bg-brand-gray font-sans overflow-hidden">
    
    <AdminSidebar v-if="userRole === 'Admin'" activeMenu="Printing & Releases" :badgeCounts="badgeCounts" />
    <StaffSidebar v-else activeMenu="Ready to Print" :counts="counts" :canReview="canReview" />

    <div class="flex-1 p-8 overflow-y-auto">
      
      <div class="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 class="m-0 text-gray-900 text-3xl font-bold tracking-tight">Printing, Payment & Release Queue</h1>
          <p class="text-gray-500 mt-1">Print approved certificates, process cashier payments, and release documents.</p>
        </div>
        
        <div class="w-full lg:w-72">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="🔍 Search name, Q# or OR#" 
            class="w-full p-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-blue shadow-sm"
          />
        </div>
      </div>

      <div class="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button 
          v-for="tab in ['All', 'Printing', 'Unpaid', 'Ready']" 
          :key="tab"
          @click="filterTab = tab"
          class="px-4 py-2 rounded-full font-bold text-xs transition-colors whitespace-nowrap cursor-pointer border"
          :class="filterTab === tab ? 'bg-brand-blue text-white border-brand-blue shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'"
        >
          {{ tab }} 
          <span v-if="tab === 'Printing'" class="ml-1 opacity-80">🖨️</span>
          <span v-if="tab === 'Unpaid'" class="ml-1 opacity-80">⏳</span>
          <span v-if="tab === 'Ready'" class="ml-1 opacity-80">📦</span>
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead class="bg-gray-50">
            <tr>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">Q #</th>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">Resident / Applicant</th>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">Document & Fee</th>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">Payment Status</th>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="req in filteredRequests" :key="req.request_id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td class="py-4 px-6 font-bold text-gray-900">{{ req.daily_sequence_no }}</td>
              <td class="py-4 px-6">
                <div class="font-bold text-gray-700 text-sm">{{ req.first_name }} {{ req.last_name }}</div>
                <div v-if="req.requested_for_others && req.requested_for_name" class="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  👥 For: {{ req.requested_for_name }}
                </div>
              </td>
              <td class="py-4 px-6">
                <b class="text-brand-blue text-sm">{{ req.doc_name }}</b><br/>
                <span class="text-xs text-green-600 font-bold">Fee: ₱{{ req.base_fee || 0 }}</span>
              </td>
              <td class="py-4 px-6">
                <span v-if="req.status === 'Waiting for Printing'" class="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  🖨️ Needs Printing
                </span>
                <span v-else-if="req.or_number" class="px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                  💰 Paid ({{ req.or_number }})
                </span>
                <span v-else class="px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                  ⏳ Unpaid / Awaiting
                </span>
              </td>
              <td class="py-4 px-6">
                <div class="flex flex-col gap-2">
                  <button 
                    v-if="req.status === 'Waiting for Printing'"
                    @click="router.push(`/print/${req.request_id}`)"
                    class="py-2 px-4 bg-brand-blue text-white rounded-lg font-bold text-xs hover:bg-brand-light-blue transition-colors shadow-sm cursor-pointer border-none"
                  >
                    🖨️ Print Certificate
                  </button>
                  <button 
                    v-else-if="!req.or_number"
                    @click="handleOpenPaymentModal(req)"
                    class="py-2 px-4 bg-amber-500 text-white rounded-lg font-bold text-xs hover:bg-amber-600 transition-colors shadow-sm cursor-pointer border-none"
                  >
                    💳 Receive Pay & Issue OR
                  </button>
                  <button 
                    v-else
                    @click="handleOpenReleaseModal(req)"
                    class="py-2 px-4 bg-emerald-500 text-white rounded-lg font-bold text-xs hover:bg-emerald-600 transition-colors shadow-sm cursor-pointer border-none"
                  >
                    📦 Validate OR & Release
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredRequests.length === 0">
              <td colspan="5" class="p-12 text-center text-gray-400 text-sm font-medium">
                <div v-if="searchQuery">No results found for "{{ searchQuery }}".</div>
                <div v-else>No documents currently in this queue.</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 1. Cashier Payment & OR Generation Modal -->
    <Transition name="modal">
      <div v-if="showPaymentModal && selectedPaymentReq" class="fixed inset-0 z-[1000] flex justify-center items-center p-4">
        <div class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" @click="showPaymentModal = false"></div>
        <div class="relative bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl transform transition-all">
          <h3 class="m-0 mb-2 text-gray-900 text-xl font-bold">💳 Cashier - Process Payment</h3>
          <p class="text-gray-500 text-sm mb-6 mt-0 leading-relaxed">Collect payment from the resident and issue an Official Receipt (OR) number.</p>
          
          <div class="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-6">
            <div class="flex justify-between text-sm mb-3">
              <span class="text-gray-500">Resident:</span>
              <span class="font-bold text-gray-900">{{ selectedPaymentReq.first_name }} {{ selectedPaymentReq.last_name }}</span>
            </div>
            <div class="flex justify-between text-sm mb-3">
              <span class="text-gray-500">Document:</span>
              <span class="font-bold text-brand-blue">{{ selectedPaymentReq.doc_name }}</span>
            </div>
            <div class="flex justify-between border-t border-dashed border-gray-300 pt-3 mt-3 items-center">
              <span class="text-gray-900 font-bold uppercase text-xs tracking-wider">AMOUNT TO PAY:</span>
              <span class="text-green-600 font-black text-2xl">₱{{ selectedPaymentReq.base_fee || 0 }}</span>
            </div>
          </div>

          <div class="flex gap-4 mb-6">
            <div class="flex-1">
              <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Amount Tendered</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₱</span>
                <input 
                  type="number" 
                  v-model="amountTendered"
                  class="w-full p-3 pl-8 border border-gray-300 rounded-lg font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-blue box-border"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div class="flex-1">
              <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Change</label>
              <div class="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg font-bold text-gray-900">
                ₱{{ changeAmount.toFixed(2) }}
              </div>
            </div>
          </div>

          <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Official Receipt (OR) Number</label>
          <div class="flex gap-2 mb-6">
            <input 
              type="text" 
              v-model="paymentOrInput"
              @input="enforceUppercaseOR($event, 'payment')"
              class="flex-1 p-3 border border-gray-300 rounded-lg font-bold text-gray-900 tracking-wide outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="e.g. OR-123456"
            />
            <button 
              type="button" 
              @click="paymentOrInput = createRandomORCode()" 
              class="px-4 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors text-sm border-none cursor-pointer"
              title="Generate another code"
            >
              🔄 Randomize
            </button>
          </div>
          
          <div class="flex gap-3">
            <button @click="showPaymentModal = false" class="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors text-sm border-none cursor-pointer">Cancel</button>
            <button @click="handleConfirmPayment" :disabled="isProcessingPayment" class="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors text-sm shadow-sm disabled:opacity-50 border-none cursor-pointer">
              {{ isProcessingPayment ? 'Processing...' : 'Confirm Pay & Issue OR' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 2. Releasing Validation Modal -->
    <Transition name="modal">
      <div v-if="showValidateModal && selectedReleaseReq" class="fixed inset-0 z-[1000] flex justify-center items-center p-4">
        <div class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" @click="showValidateModal = false"></div>
        <div class="relative bg-white p-8 rounded-2xl w-full max-w-sm shadow-2xl transform transition-all">
          <h3 class="m-0 mb-2 text-gray-900 text-xl font-bold">📦 Validate OR & Release</h3>
          <p class="text-gray-500 text-sm mb-6 mt-0 leading-relaxed">
            Enter the OR Number from the resident's receipt to validate and finalize release.
          </p>
          
          <div class="bg-green-50 p-4 rounded-xl border border-green-200 mb-6 flex items-center">
            <span class="text-green-800 font-bold text-sm">
              {{ selectedReleaseReq.first_name }} {{ selectedReleaseReq.last_name }}<br/>
              <span class="text-xs font-normal">{{ selectedReleaseReq.doc_name }}</span>
            </span>
          </div>

          <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Enter OR Number</label>
          <input 
            type="text" 
            placeholder="e.g. OR-123456" 
            v-model="validateOrInput"
            @input="enforceUppercaseOR($event, 'validate')"
            class="w-full p-3 border border-gray-300 rounded-lg mb-6 text-base font-bold outline-none focus:ring-2 focus:ring-brand-blue box-border"
            autofocus
          />
          
          <div class="flex gap-3">
            <button @click="showValidateModal = false" class="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors text-sm border-none cursor-pointer">Cancel</button>
            <button @click="handleValidateOR" class="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors text-sm shadow-sm border-none cursor-pointer">Validate & Preview</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 3. Official Receipt Preview & Final Release Modal -->
    <ReceiptModal 
      :isOpen="showReceiptPreview"
      @close="showReceiptPreview = false"
      :orNumber="previewOrNumber"
      :requestId="previewRequestId"
      @finalize="triggerFinalRelease"
      mode="preview"
    />

    <!-- Final Confirmation Modal -->
    <ConfirmModal 
      :isOpen="showReleaseConfirm"
      title="Finalize Release"
      message="Confirm finalizing this transaction and releasing the official document? This will be recorded in the Audit Logs."
      confirmText="Yes, Release Document"
      confirmColor="bg-brand-blue hover:bg-brand-light-blue"
      @confirm="handleFinalizeRelease"
      @cancel="showReleaseConfirm = false"
    />

  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .transform,
.modal-leave-to .transform {
  transform: scale(0.95);
  opacity: 0;
}
</style>
