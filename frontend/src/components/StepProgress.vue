<template>
  <div class="steps">
    <div v-for="(step, idx) in steps" :key="idx" class="step">
      <div class="status-indicator" :class="step.status">
        <div class="status-dot"></div>
      </div>
      <span class="step-text">{{ step.text }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  steps: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0.5rem 0;
}

.step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.status-indicator {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transition: all 0.3s;
}

.pending .status-dot {
  background: #94a3b8;
  opacity: 0.5;
}

.running .status-dot {
  background: #3b82f6;
  animation: pulse 1.5s infinite;
  box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
}

.success .status-dot {
  background: #22c55e;
}

.error .status-dot {
  background: #ef4444;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
}



.step-text {
  font-weight: 500;
  color: #475569;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(234, 179, 8, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); }
}
</style>
