<template>
  <div class="eri-gauge-container">
    <h3 class="gauge-title">Engagement & Resilience Index (ERI)</h3>
    <div class="gauge-wrapper">
      <div class="gauge-value">{{ value.toFixed(1) }}</div>
      <div class="gauge-label">Your School</div>
      <div class="gauge-comparison">
        National Average: {{ nationalAverage.toFixed(1) }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  value: { type: Number, default: 0 },
  nationalAverage: { type: Number, default: 0 },
  trend: { type: String, default: 'stable' }
})
</script>

<style scoped>
.eri-gauge-container {
  background: var(--card-bg);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  text-align: center;
  border: 1px solid var(--border-color);
}

.gauge-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.gauge-wrapper {
  padding: 0.5rem;
}

.gauge-value {
  font-size: 3rem;
  font-weight: 700;
  color: var(--overall-color);
  margin-bottom: var(--spacing-xs);
}

.gauge-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.gauge-comparison {
  font-size: 0.875rem;
  color: var(--text-muted);
}
</style>