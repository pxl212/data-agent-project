<template>
  <div class="input-wrapper">
    <div class="input-box" :class="{ 'is-loading': loading }">
      <textarea
        ref="textareaRef"
        v-model="localValue"
        @keydown="handleKeydown"
        :placeholder="placeholder"
        :disabled="loading"
        rows="1"
      ></textarea>
      <button
        v-if="loading"
        @click="$emit('stop')"
        class="stop-btn"
        title="停止生成"
      >
        <div class="stop-square"></div>
      </button>
      <button
        v-else
        @click="$emit('send')"
        :disabled="!localValue.trim()"
        class="send-btn"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  placeholder: { type: String, default: '询问关于业务数据的问题...' }
})

const emit = defineEmits(['update:modelValue', 'send', 'stop', 'history-up', 'history-down'])

const textareaRef = ref(null)

const localValue = ref(props.modelValue)

watch(() => props.modelValue, (v) => { localValue.value = v })
watch(localValue, (v) => { emit('update:modelValue', v); autoResize() })

function autoResize() {
  nextTick(() => {
    const el = textareaRef.value
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 150) + 'px'
  })
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (localValue.value.trim() && !props.loading) {
      emit('send')
    }
  }
  // History navigation
  if (e.key === 'ArrowUp' && !localValue.value.trim()) {
    e.preventDefault()
    emit('history-up')
  }
  if (e.key === 'ArrowDown' && !localValue.value.trim()) {
    e.preventDefault()
    emit('history-down')
  }
}

function focus() {
  textareaRef.value?.focus()
}

defineExpose({ focus })
</script>

<style scoped>
.input-wrapper {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 30px;
  display: flex;
  justify-content: center;
  padding: 0 16px;
  pointer-events: none;
  z-index: 20;
}

.input-box {
  pointer-events: auto;
  width: 100%;
  max-width: 800px;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 10px 12px 10px 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.input-box:focus-within {
  box-shadow: 0 15px 50px -10px rgba(59, 130, 246, 0.25);
  border-color: rgba(59, 130, 246, 0.4);
  background: rgba(255, 255, 255, 0.95);
}

.input-box.is-loading {
  opacity: 0.8;
}

.input-box textarea {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 1rem;
  color: #1e293b;
  font-family: inherit;
  resize: none;
  line-height: 1.5;
  max-height: 150px;
  overflow-y: auto;
}

.input-box textarea::placeholder {
  color: #94a3b8;
}

.input-box textarea::-webkit-scrollbar {
  width: 4px;
}

.input-box textarea::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.send-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: #3b82f6;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  padding: 0;
}

.send-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: scale(1.05);
}

.send-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.send-btn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

.send-btn svg {
  width: 20px;
  height: 20px;
}

/* Stop button */
.stop-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: #ef4444;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  padding: 0;
  animation: fadeIn 0.2s ease;
}

.stop-btn:hover {
  background: #dc2626;
  transform: scale(1.05);
}

.stop-btn:active {
  transform: scale(0.95);
}

.stop-square {
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 2px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
