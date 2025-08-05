<template>
  <div v-if="isLoading" class="loading-modal-overlay">
    <div class="loading-modal">
      <div class="spinner"></div>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isLoading: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: 'Loading...'
  },
  message: {
    type: String,
    default: 'Please wait while we process your request'
  }
})
</script>

<style scoped>
.loading-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 15, 35, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-modal {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  text-align: center;
  min-width: 300px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto var(--spacing-lg);
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

h3 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--text-primary);
  font-size: 1.125rem;
  font-weight: 600;
}

p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}
</style>