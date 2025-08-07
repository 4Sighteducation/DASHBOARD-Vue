<template>
  <div v-if="show" class="report-viewer-overlay">
    <div class="report-viewer-container">
      <!-- Header with controls -->
      <div class="viewer-header">
        <h3>Interactive Report Editor</h3>
        <div class="viewer-controls">
          <button @click="exportPDF" class="btn-export" :disabled="exporting">
            <span v-if="!exporting">📄 Export as PDF</span>
            <span v-else>Exporting...</span>
          </button>
          <button @click="saveHTML" class="btn-save">
            💾 Save HTML
          </button>
          <button @click="close" class="btn-close">
            ✕
          </button>
        </div>
      </div>
      
      <!-- iFrame for report content -->
      <div class="viewer-body">
        <iframe 
          ref="reportFrame"
          :srcdoc="htmlContent"
          class="report-iframe"
          @load="onFrameLoad"
        ></iframe>
      </div>
      
      <!-- Status bar -->
      <div class="viewer-footer">
        <span class="status-text">{{ statusText }}</span>
        <span class="help-text">💡 Click any text in the report to edit it directly</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { API } from '@/services/api'
import { useDashboardStore } from '@/stores/dashboard'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  htmlContent: {
    type: String,
    default: ''
  },
  reportData: {
    type: Object,
    default: () => ({})
  },
  reportInsights: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'exported'])

const store = useDashboardStore()
const reportFrame = ref(null)
const exporting = ref(false)
const statusText = ref('Report loaded - Edit any text by clicking on it')

// Watch for content changes
watch(() => props.htmlContent, async (newContent) => {
  console.log('[ReportViewer] HTML content changed, length:', newContent?.length || 0)
  console.log('[ReportViewer] HTML preview:', newContent?.substring(0, 500))
  
  if (newContent && reportFrame.value) {
    await nextTick()
    // Content will be loaded via srcdoc
  }
}, { immediate: true })

const onFrameLoad = () => {
  console.log('[ReportViewer] iframe loaded')
  
  // Add any additional functionality to the iframe content
  if (reportFrame.value && reportFrame.value.contentWindow) {
    const frameWindow = reportFrame.value.contentWindow
    const frameDocument = reportFrame.value.contentDocument
    
    console.log('[ReportViewer] Frame document:', frameDocument)
    console.log('[ReportViewer] Frame body innerHTML length:', frameDocument?.body?.innerHTML?.length || 0)
    
    // Store data in the frame for reference
    frameWindow.reportData = props.reportData
    frameWindow.reportInsights = props.reportInsights
    
    // Override the export functions in the iframe
    frameWindow.exportToPDF = exportPDF
    frameWindow.exportHTML = saveHTML
    
    // Add event listeners for changes
    const editables = frameDocument.querySelectorAll('[contenteditable="true"]')
    console.log('[ReportViewer] Found editable elements:', editables.length)
    
    editables.forEach(el => {
      el.addEventListener('input', () => {
        statusText.value = 'Content edited - Changes will be included in export'
      })
    })
  } else {
    console.error('[ReportViewer] No frame reference or contentWindow available')
  }
}

const exportPDF = async () => {
  exporting.value = true
  statusText.value = 'Generating PDF...'
  
  try {
    // Get the current HTML content from the iframe
    const frameDocument = reportFrame.value.contentDocument
    const editedHtml = frameDocument.documentElement.outerHTML
    
    // Call the PDF export endpoint
    const response = await API.exportComparativeReportPDF({
      html: editedHtml,
      establishmentName: store.selectedEstablishment?.name || 'Report'
    })
    
    // Download the PDF
    if (response.data) {
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Comparative_Report_${store.selectedEstablishment?.name}_${new Date().toISOString().split('T')[0]}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
      
      statusText.value = 'PDF exported successfully!'
      emit('exported', { type: 'pdf' })
    }
  } catch (error) {
    console.error('Failed to export PDF:', error)
    statusText.value = 'Failed to export PDF - Please try again'
  } finally {
    exporting.value = false
  }
}

const saveHTML = () => {
  try {
    // Get the current HTML content from the iframe
    const frameDocument = reportFrame.value.contentDocument
    const editedHtml = frameDocument.documentElement.outerHTML
    
    // Create a blob and download
    const blob = new Blob([editedHtml], { type: 'text/html' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Comparative_Report_${store.selectedEstablishment?.name}_${new Date().toISOString().split('T')[0]}.html`
    link.click()
    window.URL.revokeObjectURL(url)
    
    statusText.value = 'HTML saved successfully!'
    emit('exported', { type: 'html' })
  } catch (error) {
    console.error('Failed to save HTML:', error)
    statusText.value = 'Failed to save HTML - Please try again'
  }
}

const close = () => {
  emit('close')
}
</script>

<style scoped>
.report-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

.report-viewer-container {
  width: 95%;
  height: 95%;
  max-width: 1600px;
  background: white;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.viewer-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.viewer-controls {
  display: flex;
  gap: 0.75rem;
}

.viewer-controls button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-export {
  background: #10b981;
  color: white;
}

.btn-export:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
}

.btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-save {
  background: #3b82f6;
  color: white;
}

.btn-save:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-close {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.viewer-body {
  flex: 1;
  overflow: hidden;
  background: #f5f5f5;
}

.report-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

.viewer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  border-radius: 0 0 12px 12px;
  font-size: 0.875rem;
}

.status-text {
  color: #374151;
  font-weight: 500;
}

.help-text {
  color: #6b7280;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
