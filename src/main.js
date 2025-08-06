import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// Global initializer function that Knack's AppLoader will call
window.initializeVueDashboard = function() {
  console.log('Vue Dashboard: Initializing...')
  
  // First check if WordCloud2 is available
  if (typeof window.WordCloud === 'undefined') {
    console.warn('WordCloud2 not immediately available, checking again in 500ms...')
    
    // Try again after a short delay (CDN script might still be executing)
    setTimeout(() => {
      if (typeof window.WordCloud === 'undefined') {
        console.error('WordCloud2 still not available after delay - will use fallback rendering')
        console.warn('AppLoader should have loaded: https://cdn.jsdelivr.net/npm/wordcloud@1.2.2/src/wordcloud2.js')
      } else {
        console.log('WordCloud2 became available after delay!')
      }
    }, 500)
  } else {
    console.log('WordCloud2 is available and ready!')
  }
  
  // Get config from AppLoader
  const config = window.DASHBOARD_CONFIG
  if (!config) {
    console.error('Vue Dashboard: No DASHBOARD_CONFIG found')
    return
  }
  
  // Check if app already exists and unmount it
  if (window.__vueDashboardApp) {
    console.log('Vue Dashboard: Unmounting existing app')
    window.__vueDashboardApp.unmount()
  }
  
  // Check if container exists
  const container = document.querySelector(config.elementSelector)
  if (!container) {
    console.error(`Vue Dashboard: Container not found: ${config.elementSelector}`)
    return
  }
  
  // Clear container and any rich text elements
  container.innerHTML = ''
  
  // Also try to hide any rich text views that might be in the way
  const richTextElements = container.querySelectorAll('.kn-rich-text, .kn-view-content')
  richTextElements.forEach(el => el.style.display = 'none')
  
  console.log('Vue Dashboard: Container cleared and ready')
  
  // Create mount point
  const mountPoint = document.createElement('div')
  mountPoint.id = 'vue-dashboard-app'
  container.appendChild(mountPoint)
  
  // Create Vue app
  const app = createApp(App)
  
  // Create Pinia store
  const pinia = createPinia()
  app.use(pinia)
  
  // Make config available globally in Vue app
  app.config.globalProperties.$dashboardConfig = config
  
  // Provide config to all components
  app.provide('dashboardConfig', config)
  
  // Mount the app
  window.__vueDashboardApp = app.mount(mountPoint)
  
  console.log('Vue Dashboard: Initialized successfully')
}

// Also export for development
export const initializeVueDashboard = window.initializeVueDashboard