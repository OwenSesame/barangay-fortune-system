<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import AdminSidebar from '../components/AdminSidebar.vue'
import { useToast } from '../composables/useToast'

const toast = useToast()

const documents = ref([])
const isModalOpen = ref(false)
const newDoc = ref({ doc_name: '', base_fee: '', requires_attachment: 0 })
const badgeCounts = ref({ pending: 0, ready: 0, residentApprovals: 0 })

let interval = null

const fetchDocuments = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/admin/document-templates')
    documents.value = response.data
  } catch (error) {
    console.error("Failed to fetch documents", error)
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
  fetchDocuments()
  fetchCounts()
  interval = setInterval(fetchCounts, 5000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

const handleAddDocument = async () => {
  try {
    await axios.post('http://localhost:5000/api/admin/document-templates', newDoc.value)
    toast.success("New Document Successfully Added!")
    isModalOpen.value = false
    newDoc.value = { doc_name: '', base_fee: '', requires_attachment: 0 }
    fetchDocuments()
  } catch (error) {
    toast.error("Error adding document.")
  }
}

const handleToggle = async (id, currentStatus) => {
  try {
    const newStatus = currentStatus === 1 ? 0 : 1
    await axios.put(`http://localhost:5000/api/admin/document-templates/${id}/toggle`, { available: newStatus })
    fetchDocuments()
    toast.success(`Document ${newStatus === 1 ? 'Enabled' : 'Disabled'}`)
  } catch (error) {
    toast.error("Error updating document status.")
  }
}

const handleToggleAttachment = async (id, currentStatus) => {
  try {
    const newStatus = currentStatus === 1 ? 0 : 1
    await axios.put(`http://localhost:5000/api/admin/document-templates/${id}/toggle-attachment`, { requires_attachment: newStatus })
    fetchDocuments()
    toast.success(`Attachment requirement updated`)
  } catch (error) {
    toast.error("Error updating document attachment requirement.")
  }
}
</script>

<template>
  <div class="flex h-screen bg-brand-gray font-sans overflow-hidden">
    
    <AdminSidebar activeMenu="Document Management" :badgeCounts="badgeCounts" />

    <div class="flex-1 p-8 overflow-y-auto">
      <div class="flex justify-between items-start mb-8">
        <div>
          <h1 class="m-0 text-gray-900 text-3xl font-bold tracking-tight">Document Templates</h1>
          <p class="text-gray-500 mt-1">Manage the types of documents residents can request and set their fees.</p>
        </div>
        <button 
          @click="isModalOpen = true" 
          class="px-6 py-3 bg-brand-blue hover:bg-brand-light-blue text-white rounded-lg font-bold shadow-md transition-colors text-sm"
        >
          + Create New Document
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead class="bg-gray-50">
            <tr>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">ID</th>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">Document Name</th>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">Base Fee</th>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">Attachment Req.</th>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">Status</th>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doc in documents" :key="doc.doc_type_id" class="border-b border-gray-50 hover:bg-gray-50">
              <td class="py-4 px-6 font-bold text-gray-500 text-sm">{{ doc.doc_type_id }}</td>
              <td class="py-4 px-6 font-bold text-gray-900 text-sm">{{ doc.doc_name }}</td>
              <td class="py-4 px-6 font-bold text-green-600 text-sm">₱{{ doc.base_fee }}</td>
              <td class="py-4 px-6">
                <button 
                  @click="handleToggleAttachment(doc.doc_type_id, doc.requires_attachment)" 
                  :class="['px-3 py-1.5 rounded-full text-xs font-bold border transition-colors', doc.requires_attachment === 1 ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200']"
                >
                  {{ doc.requires_attachment === 1 ? 'Required' : 'Not Required' }}
                </button>
              </td>
              <td class="py-4 px-6">
                <span :class="['px-3 py-1.5 rounded-full text-xs font-bold border', doc.available === 1 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200']">
                  {{ doc.available === 1 ? 'Active / Visible' : 'Hidden' }}
                </span>
              </td>
              <td class="py-4 px-6 text-right">
                <button 
                  @click="handleToggle(doc.doc_type_id, doc.available)" 
                  :class="['px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors shadow-sm', doc.available === 1 ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600']"
                >
                  {{ doc.available === 1 ? 'Disable' : 'Enable' }}
                </button>
              </td>
            </tr>
            <tr v-if="documents.length === 0">
              <td colspan="6" class="p-12 text-center text-gray-400 text-sm font-medium">No documents found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Document Modal -->
    <Transition name="modal">
      <div v-if="isModalOpen" class="fixed inset-0 z-[1000] flex justify-center items-center p-4">
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="isModalOpen = false"></div>
        <div class="relative bg-white p-10 rounded-2xl w-full max-w-[450px] shadow-2xl transform transition-all">
          <h2 class="m-0 mb-6 text-gray-900 text-2xl font-bold">Add New Document</h2>
          <form @submit.prevent="handleAddDocument" class="flex flex-col gap-5">
            <div>
              <label class="block mb-2 text-sm text-gray-600 font-bold uppercase tracking-wide">Document Name</label>
              <input type="text" v-model="newDoc.doc_name" required class="w-full p-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
            <div>
              <label class="block mb-2 text-sm text-gray-600 font-bold uppercase tracking-wide">Base Fee (₱)</label>
              <input type="number" v-model="newDoc.base_fee" required min="0" class="w-full p-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
            <div class="flex items-center gap-3">
              <input type="checkbox" id="requires_attachment" :checked="newDoc.requires_attachment === 1" @change="e => newDoc.requires_attachment = e.target.checked ? 1 : 0" class="w-5 h-5 rounded border-gray-300 text-brand-blue focus:ring-brand-blue cursor-pointer" />
              <label for="requires_attachment" class="text-sm font-semibold text-gray-700 cursor-pointer select-none">Requires Attachment <span class="text-gray-400 font-normal">(e.g., ID, Proof of Income)</span></label>
            </div>
            <div class="flex gap-3 mt-4">
              <button type="button" @click="isModalOpen = false" class="flex-1 p-3 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition-colors border-none cursor-pointer">Cancel</button>
              <button type="submit" class="flex-1 p-3 bg-brand-blue text-white rounded-lg font-bold hover:bg-brand-light-blue transition-colors shadow-sm border-none cursor-pointer">Save Document</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
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
