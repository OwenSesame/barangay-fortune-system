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

const docType = ref('')
const purpose = ref('')
const scheduledDate = ref('')
const requirementFile = ref(null)
const requirementPreviewUrl = ref(null)
const isSubmitting = ref(false)
const fileInput = ref(null)

onBeforeRouteLeave((to, from, next) => {
  if ((docType.value || purpose.value || scheduledDate.value || requirementFile.value) && !isSubmitting.value) {
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
  if (!docType.value) return false
  const selectedDocObj = availableDocs.value.find(d => 
    d.doc_type_id === parseInt(docType.value, 10) || d.doc_type_id === docType.value
  )
  return selectedDocObj ? selectedDocObj.requires_attachment === 1 : false
})

const handleFileChange = (event) => {
  if (event.target.files.length > 0) {
    const file = event.target.files[0]
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.")
      event.target.value = ''
      requirementFile.value = null
      requirementPreviewUrl.value = null
      return
    }

    requirementFile.value = file
    
    // Generate preview
    if (requirementPreviewUrl.value) {
      URL.revokeObjectURL(requirementPreviewUrl.value)
    }
    requirementPreviewUrl.value = URL.createObjectURL(file)

  } else {
    requirementFile.value = null
    requirementPreviewUrl.value = null
  }
}

const handleSubmit = async () => {
  if (isSubmitting.value) return
  
  if (!docType.value) return toast.error("Please select a document type.")
  if (!scheduledDate.value) return toast.error("Please select an appointment date.")
  
  if (selectedDocRequiresAttachment.value && !requirementFile.value) {
    return toast.error("Please upload the required document/ID.")
  }

  const myId = localStorage.getItem('userId')
  const formData = new FormData()
  
  formData.append('resident_id', myId)
  formData.append('doc_type_id', docType.value)
  formData.append('purpose', purpose.value)
  formData.append('scheduled_date', scheduledDate.value)
  
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
    docType.value = ''
    purpose.value = ''
    scheduledDate.value = ''
    requirementFile.value = null
    router.push('/resident-dashboard')
  } catch (error) {
    if (error.response && error.response.status === 403) {
      toast.error(error.response.data.error || "Anti-Spam Alert: Active request already exists.")
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
              v-model="docType" 
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
              v-model="scheduledDate" 
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
              v-model="purpose" 
              required 
              class="w-full p-3 rounded-lg border border-gray-300 text-base outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white transition-colors placeholder-gray-400"
            />
          </div>

          <div v-if="selectedDocRequiresAttachment" class="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <label class="block mb-2 text-brand-blue font-bold text-sm">Upload Requirement (Valid ID, Cedula, etc.)</label>
            <input 
              type="file" 
              accept="image/*,.pdf" 
              @change="handleFileChange"
              required 
              class="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-brand-light-blue cursor-pointer"
            />
            
            <div v-if="requirementPreviewUrl" class="mt-4">
              <p class="text-xs text-gray-500 font-bold mb-2 uppercase">File Preview</p>
              <img v-if="requirementFile.type.startsWith('image/')" :src="requirementPreviewUrl" class="w-full max-h-48 object-contain rounded-lg border border-gray-300 bg-gray-100" />
              <embed v-else-if="requirementFile.type === 'application/pdf'" :src="requirementPreviewUrl" type="application/pdf" class="w-full h-48 rounded-lg border border-gray-300" />
            </div>

            <p class="text-xs text-gray-500 mt-3 mb-0 font-medium">
              Maximum file size is 5MB. Please provide a clear picture or PDF of the specific requirement needed for this document.
            </p>
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
