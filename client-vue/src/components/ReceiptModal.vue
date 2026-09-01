<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  orNumber: {
    type: String,
    default: ''
  },
  requestId: {
    type: [String, Number],
    default: null
  },
  mode: {
    type: String,
    default: 'preview'
  }
})

const emit = defineEmits(['close', 'finalize'])

const receiptData = ref(null)
const loading = ref(false)
const error = ref(false)

watch(() => props.isOpen, async (newVal) => {
  if (newVal && props.requestId) {
    loading.value = true
    error.value = false
    try {
      const res = await axios.get(`http://localhost:5000/api/staff/receipt/${props.requestId}`)
      receiptData.value = res.data
    } catch (err) {
      console.error(err)
      error.value = true
    } finally {
      loading.value = false
    }
  }
})

const printSlip = () => {
  window.print()
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 flex justify-center items-center z-[1050]">
    <div class="bg-white p-8 rounded-xl w-[450px] max-w-[90vw] shadow-2xl printable-receipt-slip">
      <div v-if="loading" class="text-center p-10 text-gray-500 font-semibold">
        Loading Receipt...
      </div>
      
      <div v-else-if="receiptData">
        <div class="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
          <h2 class="m-0 text-gray-900 text-2xl tracking-wide uppercase font-bold">Official Receipt</h2>
          <p class="mt-1 mb-0 text-gray-500 text-sm">Barangay Fortune, Marikina City</p>
          <p class="mt-0.5 mb-0 text-gray-400 text-xs">Official E-Serbisyo Transaction Slip</p>
        </div>
        
        <div class="flex justify-between mb-3">
          <span class="text-gray-500 text-sm">Date:</span>
          <span class="text-gray-900 text-sm font-bold">{{ new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }}</span>
        </div>
        <div class="flex justify-between mb-3">
          <span class="text-gray-500 text-sm">OR Number:</span>
          <span class="text-green-600 text-base font-bold tracking-wide">{{ orNumber || receiptData.or_number || 'N/A' }}</span>
        </div>
        <div class="flex justify-between mb-3">
          <span class="text-gray-500 text-sm">Resident:</span>
          <span class="text-gray-900 text-sm font-bold">{{ receiptData.first_name }} {{ receiptData.last_name }}</span>
        </div>
        <div class="flex justify-between mb-3">
          <span class="text-gray-500 text-sm">Document:</span>
          <span class="text-gray-900 text-sm font-bold">{{ receiptData.doc_name }}</span>
        </div>
        
        <div class="border-t-2 border-dashed border-gray-300 pt-4 mt-4 flex justify-between items-center">
          <span class="text-gray-900 text-base font-bold">TOTAL AMOUNT:</span>
          <span class="text-gray-900 text-lg font-bold">₱{{ receiptData.base_fee || '0.00' }}</span>
        </div>

        <div class="text-center mt-6 pt-3 border-t border-gray-100">
          <p class="m-0 text-gray-500 text-xs">Processed By: <b>{{ receiptData.staff_name || 'Front Desk Staff' }}</b></p>
          <p class="mt-1 mb-0 text-gray-400 text-[10px]">Thank you for transacting with Barangay Fortune.</p>
        </div>
        
        <div class="no-print flex gap-3 justify-center mt-6">
          <template v-if="mode === 'preview'">
            <button @click="emit('close')" class="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition">Cancel</button>
            <button @click="printSlip" class="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition">🖨️ Print Slip</button>
            <button @click="emit('finalize')" class="px-4 py-2 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition flex-1">Finalize & Release</button>
          </template>
          <template v-else>
            <button @click="printSlip" class="px-5 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition flex-1">🖨️ Print Slip</button>
            <button @click="emit('close')" class="px-5 py-2 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600 transition flex-1">Close</button>
          </template>
        </div>
      </div>

      <div v-else class="text-center p-10 text-red-500">
        Error: Could not load receipt details.
        <div class="no-print mt-5">
          <button @click="emit('close')" class="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@media print {
  body * {
    visibility: hidden !important;
  }
  .printable-receipt-slip, .printable-receipt-slip * {
    visibility: visible !important;
  }
  .printable-receipt-slip {
    position: fixed !important;
    left: 50% !important;
    top: 20px !important;
    transform: translateX(-50%) !important;
    width: 380px !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 24px !important;
    box-shadow: none !important;
    border: 2px dashed #334155 !important;
    background: white !important;
    color: black !important;
  }
  .no-print {
    display: none !important;
  }
}
</style>
