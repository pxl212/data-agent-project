<template>
  <div class="welcome-screen">
    <div class="welcome-header">
      <div class="welcome-icon-container">
        <svg class="welcome-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      </div>
      <h1>Data Agent</h1>
      <p>您的智能业务数据分析助手，支持自然语言即时查询</p>
    </div>
    <div class="suggested-queries">
      <div
        class="query-card"
        v-for="(sq, i) in suggestedQueries"
        :key="i"
        @click="$emit('select', sq)"
      >
        <div class="query-icon">💡</div>
        <span>{{ sq }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  suggestedQueries: {
    type: Array,
    default: () => []
  }
})

defineEmits(['select'])
</script>

<style scoped>
.welcome-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  animation: fadeIn 0.8s ease-out;
}

.welcome-header {
  text-align: center;
  margin-bottom: 3rem;
}

.welcome-icon-container {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.5);
}

.welcome-icon {
  width: 40px;
  height: 40px;
  color: white;
}

.welcome-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.welcome-header p {
  font-size: 1.1rem;
  color: #64748b;
  margin: 0;
}

.suggested-queries {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 600px;
}

.query-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  padding: 1.25rem 1.5rem;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.query-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.query-icon {
  font-size: 1.5rem;
}

.query-card span {
  font-weight: 500;
  color: #334155;
  font-size: 1.05rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
