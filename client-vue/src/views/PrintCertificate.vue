<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useToast } from '../composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const docData = ref(null)
const isLoading = ref(true)

const id = route.params.id
const today = computed(() => {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
})

const fetchDocData = async () => {
  try {
    const response = await axios.get(`http://localhost:5000/api/staff/print-data/${id}`)
    docData.value = response.data
  } catch (error) {
    console.error("Error fetching document data", error)
    toast.error("Failed to load document data.")
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchDocData()
})

const handlePrint = async () => {
  try {
    const staffId = localStorage.getItem('userId')
    await axios.put(`http://localhost:5000/api/staff/update-status/${id}`, { 
      status: 'Ready for Pickup', 
      official_id: staffId 
    })
  } catch (error) {
    console.error("Failed to update status", error)
    toast.error("Failed to update status automatically.")
  }
  window.print() 
}

const handleBack = () => {
  if (window.history.length > 2) {
    window.history.back()
  } else {
    router.push('/')
  }
}
</script>

<template>
  <div class="print-page bg-gray-200 min-h-screen py-10 px-5 font-serif">
    
    <div v-if="isLoading" class="text-center mt-12 font-sans font-medium text-gray-500">
      Loading Document...
    </div>

    <template v-else>
      <div class="no-print max-w-[800px] mx-auto mb-5 flex justify-between bg-white px-5 py-4 rounded-lg shadow-sm font-sans">
        <button 
          @click="handleBack" 
          class="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white border-none rounded-md cursor-pointer font-bold transition-colors shadow-sm text-sm"
        >
          ⬅ Back to Queue
        </button>
        <button 
          @click="handlePrint" 
          class="px-5 py-2.5 bg-brand-blue hover:bg-brand-light-blue text-white border-none rounded-md cursor-pointer font-bold text-base transition-colors shadow-sm"
        >
          🖨️ Print Official Document
        </button>
      </div>

      <!-- The Actual A4 Document Paper -->
      <div class="print-container bg-white max-w-[800px] mx-auto p-[80px] shadow-lg min-h-[1122px] relative text-black text-[17px] leading-relaxed">
        
        <div class="text-center mb-[50px]">
          <p class="m-0 text-base">Republic of the Philippines</p>
          <p class="m-0 text-base">Province of Bulacan</p>
          <p class="m-0 text-base">Municipality of Baliwag</p>
          <h2 class="mt-[15px] mb-0 text-2xl uppercase tracking-wide font-bold">BARANGAY FORTUNE</h2>
          <hr class="border-t-[2px] border-black my-[20px]" />
          <h1 class="my-[30px] text-[32px] uppercase tracking-[2px] underline font-bold">
            {{ docData.doc_name }}
          </h1>
        </div>

        <div class="text-[18px] leading-[2]">
          <p><strong>TO WHOM IT MAY CONCERN:</strong></p>
          <template v-if="docData.requested_for_others && docData.requested_for_name">
            <p class="indent-[40px] text-justify">
              This is to certify that <strong>{{ docData.requested_for_name }}</strong> is a bonafide resident of 
              <strong> {{ docData.addres_street }}</strong>, Barangay Fortune, Baliwag, Bulacan.
            </p>
            <p class="indent-[40px] text-justify">
              Based on the records of this office, the aforementioned individual has no derogatory record 
              and is known to be a person of good moral character in the community.
            </p>
            <p class="indent-[40px] text-justify">
              This certification is being issued upon the request of <strong>{{ docData.first_name }} {{ docData.middle_name ? docData.middle_name + ' ' : '' }}{{ docData.last_name }}</strong> (authorized representative) for <strong>{{ docData.purpose || 'whatever legal purpose it may serve' }}</strong>.
            </p>
          </template>
          <template v-else>
            <p class="indent-[40px] text-justify">
              This is to certify that <strong>{{ docData.first_name }} {{ docData.middle_name ? docData.middle_name + ' ' : '' }}{{ docData.last_name }}</strong>, 
              of legal age, <strong>{{ docData.civil_status || 'Single' }}</strong>, is a bonafide resident of 
              <strong> {{ docData.addres_street }}</strong>, Barangay Fortune, Baliwag, Bulacan.
            </p>
            <p class="indent-[40px] text-justify">
              Based on the records of this office, the aforementioned individual has no derogatory record 
              and is known to be a person of good moral character in the community.
            </p>
            <p class="indent-[40px] text-justify">
              This certification is being issued upon the request of the interested party for <strong>{{ docData.purpose || 'whatever legal purpose it may serve' }}</strong>.
            </p>
          </template>
          <p class="indent-[40px] mt-[30px]">
            Issued this <strong>{{ today }}</strong> at Barangay Fortune, Baliwag, Bulacan.
          </p>
        </div>

        <div class="mt-[100px] flex justify-end">
          <div class="text-center w-[300px]">
            <div class="border-b border-black h-[40px]"></div>
            <p class="mt-[5px] mb-0 font-bold text-[18px]">
              {{ docData.captain_name ? docData.captain_name.toUpperCase() : 'JUAN DELA CRUZ' }}
            </p>
            <p class="m-0 text-[14px]">Punong Barangay</p>
          </div>
        </div>

        <div class="absolute bottom-[80px] left-[80px]">
          <p class="m-0 text-[12px]">Fee Paid: ₱{{ docData.base_fee }}</p>
          <p class="m-0 text-[12px]">Not Valid Without Official Dry Seal</p>
        </div>
      </div>
    </template>
  </div>
</template>

<style>
@media print {
  @page { margin: 0; size: A4; }
  .no-print { display: none !important; }
  body { background: white !important; margin: 0 !important; }
  .print-page { background: white !important; padding: 0 !important; margin: 0 !important; }
  .print-container { box-shadow: none !important; padding: 40px !important; margin: 0 !important; }
}
</style>
