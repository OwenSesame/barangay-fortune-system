<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import axios from 'axios'
import ResidentSidebar from '../components/ResidentSidebar.vue'
import ResidentBottomNav from '../components/ResidentBottomNav.vue'
import { useToast } from '../composables/useToast'

const router = useRouter()
const toast = useToast()
const availableDocs = ref([])
const availableDates = ref([])

const form = ref({
  docType: '',
  purpose: '',
  scheduledDate: '',
  requestForOthers: false,
  requestedForName: ''
})
const requirementFile = ref(null)
const authorizationProof = ref(null)
const requirementPreviewUrl = ref(null)
const isSubmitting = ref(false)
const fileInput = ref(null)

onBeforeRouteLeave((to, from, next) => {
  if ((form.value.docType || form.value.purpose || form.value.scheduledDate || requirementFile.value) && !isSubmitting.value) {
    const answer = window.confirm('You have unsaved changes. Are you sure you want to leave?')
    if (answer) {
      next()
    } else {
      next(false)
    }
  } else {
    next()
  }
})

onMounted(async () => {
  const myId = localStorage.getItem('userId')
  if (!myId) return router.push('/')

  try {
    const [docsRes, datesRes] = await Promise.all([
      axios.get('http://localhost:5000/api/requests/documents'),
      axios.get('http://localhost:5000/api/requests/available-dates')
    ])
    availableDocs.value = docsRes.data
    availableDates.value = datesRes.data
  } catch (err) {
    console.error("Error fetching data:", err)
  }
})

const selectedDocRequiresAttachment = computed(() => {
  if (!form.value.docType) return false
  const selectedDocObj = availableDocs.value.find(d => 
    d.doc_type_id === parseInt(form.value.docType, 10) || d.doc_type_id === form.value.docType
  )
  return selectedDocObj ? selectedDocObj.requires_attachment === 1 : false
})

const handleRequirementChange = (e) => {
  requirementFile.value = e.target.files[0]
}

const handleAuthorizationChange = (e) => {
  authorizationProof.value = e.target.files[0]
}

const handleToggleForOthers = () => {
  if (!form.value.requestForOthers) {
    form.value.requestedForName = ''
    authorizationProof.value = null
  }
}

const handleSubmit = async () => {
  if (isSubmitting.value) return
  
  if (!form.value.docType) return toast.error("Please select a document type.")
  if (!form.value.scheduledDate) return toast.error("Please select an appointment date.")
  
  if (selectedDocRequiresAttachment.value && !requirementFile.value) {
    return toast.error("Please upload the required document/ID.")
  }

  if (form.value.requestForOthers) {
    if (!form.value.requestedForName || !form.value.requestedForName.trim()) {
      return toast.error("Please enter the full name of the person this document is for.")
    }
    if (!authorizationProof.value) {
      return toast.error("Please upload proof of authorization or relationship (ID, Authorization Letter, or Certificate).")
    }
  }

  const myId = localStorage.getItem('userId')
  const formData = new FormData()
  
  formData.append('resident_id', myId)
  formData.append('doc_type_id', form.value.docType)
  formData.append('purpose', form.value.purpose)
  formData.append('scheduled_date', form.value.scheduledDate)
  formData.append('requested_for_others', form.value.requestForOthers ? 'true' : 'false')
  
  if (form.value.requestForOthers) {
    formData.append('requested_for_name', form.value.requestedForName.trim())
    if (authorizationProof.value) {
      formData.append('authorization_proof', authorizationProof.value)
    }
  }
  
  if (requirementFile.value) {
    formData.append('requirement_file', requirementFile.value)
  }

  isSubmitting.value = true

  try {
    const response = await axios.post('http://localhost:5000/api/requests/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    toast.success(`Success! Your Queue Number is: ${response.data.queue_number}`)
    // Reset state before pushing to prevent route guard block
    form.value = { docType: '', purpose: '', scheduledDate: '', requestForOthers: false, requestedForName: '' }
    requirementFile.value = null
    authorizationProof.value = null
    router.push('/resident-dashboard')
  } catch (error) {
    if (error.response && error.response.status === 403) {
      toast.error(error.response.data.error || "Anti-Spam Alert: Active request already exists.")
    } else if (error.response && error.response.data && error.response.data.error) {
      toast.error(error.response.data.error)
    } else {
      toast.error("Error submitting application. Please try again.")
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col md:flex-row min-h-screen bg-brand-gray font-sans pb-[65px] md:pb-0">
    
    <ResidentSidebar activeMenu="Request Document" />

    <div class="flex-1 p-5 md:p-10 flex justify-center items-start w-full overflow-x-hidden overflow-y-auto">
      <div class="bg-white p-10 rounded-2xl shadow-sm border border-gray-200 w-full max-w-[600px] mt-5 mb-10">
        
        <h2 class="m-0 mb-2 text-gray-900 text-2xl font-bold tracking-tight">New Document Application</h2>
        <p class="text-gray-500 mb-8 mt-0 text-sm">Fill out the details below and attach the necessary requirements.</p>
        
        <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">
          
          <div>
            <label class="block mb-2 text-gray-700 font-bold text-sm">Document Type</label>
            <select 
              v-model="form.docType" 
              class="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 text-base outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white transition-colors"
              required
            >
              <option value="" disabled>-- Select a Document --</option>
              <option v-for="doc in availableDocs" :key="doc.doc_type_id" :value="doc.doc_type_id">
                {{ doc.doc_name }} (Fee: ₱{{ doc.base_fee }})
              </option>
            </select>
          </div>

          <div>
            <label class="block mb-2 text-gray-700 font-bold text-sm">Select Appointment Date</label>
            <select 
              v-model="form.scheduledDate" 
              class="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 text-base outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white transition-colors"
              required
            >
              <option value="" disabled>-- Select a Date --</option>
              <option 
                v-for="(d, index) in availableDates" 
                :key="index" 
                :value="d.date" 
                :disabled="d.isFull" 
                :class="d.isFull ? 'text-red-500' : 'text-gray-900'"
              >
                {{ d.display }} {{ d.isFull ? '(QUEUE FULL)' : '' }}
              </option>
            </select>
          </div>

          <div>
            <label class="block mb-2 text-gray-700 font-bold text-sm">Purpose of Request</label>
            <input 
              type="text" 
              placeholder="e.g., Employment, School Requirement, Travel" 
              v-model="form.purpose" 
              required 
              class="w-full p-3 rounded-lg border border-gray-300 text-base outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white transition-colors placeholder-gray-400"
            />
          </div>

          <div v-if="selectedDocRequiresAttachment" class="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <label class="block mb-2 text-brand-blue font-bold text-sm">Upload Requirement (Valid ID, Cedula, etc.)</label>
            <input 
              type="file" 
              accept="image/*,.pdf" 
              @change="handleRequirementChange"
              required 
              class="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-brand-light-blue cursor-pointer"
            />
          </div>
          
          <div class="mt-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
              Document Requirements
            </h3>
            
            <div class="mb-6 pb-6 border-b border-gray-100">
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="form.requestForOthers" @change="handleToggleForOthers" class="w-5 h-5 text-brand-blue rounded border-gray-300 focus:ring-brand-blue transition-colors" />
                <span class="text-gray-700 font-semibold">I am requesting this on behalf of someone else</span>
              </label>
              
              <div v-if="form.requestForOthers" class="mt-4 space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1">Full Name of Person</label>
                  <input type="text" v-model="form.requestedForName" required placeholder="Enter the name of the person this is for" class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue outline-none bg-white" />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1">Proof of Authorization</label>
                  <p class="text-xs text-gray-500 mb-2">Please upload a valid ID of the person, a Birth Certificate, or an Authorization Letter proving your relationship.</p>
                  <input type="file" @change="handleAuthorizationChange" required accept="image/*,.pdf" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="w-full p-4 mt-4 rounded-lg text-base font-bold text-white border-none cursor-pointer transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            :class="isSubmitting ? 'bg-gray-400' : 'bg-brand-blue hover:bg-brand-light-blue'"
          >
            {{ isSubmitting ? 'Submitting... Please Wait' : 'Submit Application' }}
          </button>

        </form>

      </div>
    </div>

    <ResidentBottomNav />
  </div>
</template>
