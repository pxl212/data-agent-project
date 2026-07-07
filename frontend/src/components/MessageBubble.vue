<template>
  <div :class="['message-row', msg.role]">
    <!-- Assistant Avatar -->
    <div v-if="msg.role === 'assistant'" class="avatar assistant-avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
        <rect x="3" y="8" width="18" height="12" rx="4"/>
      </svg>
    </div>

    <!-- Bubble -->
    <div :class="['bubble-wrapper', { 'is-table': msg.type === 'table' }]">
      <div class="bubble">
        <!-- Text (with markdown) -->
        <div v-if="msg.type === 'text'" class="text-content" v-html="renderedContent"></div>

        <!-- Steps -->
        <StepProgress v-else-if="msg.type === 'steps'" :steps="msg.steps" />

        <!-- Table / Chart -->
        <div v-else-if="msg.type === 'table'" class="data-view">
          <div class="view-toggle">
            <button
              :class="['toggle-btn', { active: !showChart }]"
              @click="showChart = false"
            >📋 表格</button>
            <button
              :class="['toggle-btn', { active: showChart }]"
              @click="showChart = true"
            >📊 图表</button>
          </div>
          <ResultTable
            v-if="!showChart"
            :columns="msg.columns"
            :rows="msg.rows"
          />
          <ChartView
            v-else
            :columns="msg.columns"
            :rows="msg.rows"
          />
        </div>

        <!-- Error -->
        <div v-else-if="msg.type === 'error'" class="error-text">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="error-icon">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ msg.content }}</span>
          <button v-if="msg.originalQuery" class="retry-btn" @click="$emit('retry', msg.originalQuery)" title="重新发送">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            重试
          </button>
        </div>
      </div>

      <!-- Meta info: timestamp + duration -->
      <div class="bubble-meta">
        <span v-if="msg.timestamp" class="meta-time">{{ formatTime(msg.timestamp) }}</span>
        <span v-if="msg.duration" class="meta-duration">· 用时 {{ formatDuration(msg.duration) }}</span>
      </div>
    </div>

    <!-- User Avatar -->
    <div v-if="msg.role === 'user'" class="avatar user-avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { marked } from 'marked'
import StepProgress from './StepProgress.vue'
import ResultTable from './ResultTable.vue'
import ChartView from './ChartView.vue'

const props = defineProps({
  msg: { type: Object, required: true },
  formatTime: { type: Function, required: true },
  formatDuration: { type: Function, required: true },
  enableTypewriter: { type: Boolean, default: false }
})

defineEmits(['retry'])

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true
})

const displayedText = ref('')
const showChart = ref(false)
let typewriterTimer = null

const renderedContent = computed(() => {
  if (props.msg.type !== 'text') return ''
  const text = props.enableTypewriter && props.msg.role === 'assistant'
    ? displayedText.value
    : (props.msg.content || '')
  // Only apply markdown for assistant messages
  if (props.msg.role === 'assistant') {
    return marked.parse(text)
  }
  return text
})

function startTypewriter(fullText) {
  if (typewriterTimer) clearInterval(typewriterTimer)
  displayedText.value = ''
  let i = 0
  typewriterTimer = setInterval(() => {
    if (i < fullText.length) {
      displayedText.value += fullText[i]
      i++
    } else {
      clearInterval(typewriterTimer)
      typewriterTimer = null
    }
  }, 25)
}

onMounted(() => {
  if (
    props.enableTypewriter &&
    props.msg.type === 'text' &&
    props.msg.role === 'assistant' &&
    props.msg.content
  ) {
    startTypewriter(props.msg.content)
  }
})

watch(
  () => props.msg.content,
  (newContent) => {
    if (
      props.enableTypewriter &&
      props.msg.type === 'text' &&
      props.msg.role === 'assistant' &&
      newContent
    ) {
      startTypewriter(newContent)
    }
  }
)
</script>

<style scoped>
.message-row {
  display: flex;
  margin-bottom: 1.5rem;
  animation: slideUp 0.4s ease-out;
}

.message-row.assistant {
  justify-content: flex-start;
}

.message-row.user {
  justify-content: flex-end;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 12px;
  flex-shrink: 0;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.assistant-avatar {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #4f46e5;
}
.assistant-avatar svg { width: 22px; height: 22px; }

.user-avatar {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #ffffff;
}
.user-avatar svg { width: 22px; height: 22px; }

.bubble-wrapper {
  max-width: 85%;
  display: flex;
  flex-direction: column;
}

.bubble-wrapper.is-table {
  width: 100%;
}

.bubble-wrapper.is-table .bubble {
  width: 100%;
  overflow-x: auto;
}

.bubble {
  padding: 1rem 1.25rem;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  line-height: 1.5;
  font-size: 0.95rem;
  word-break: break-word;
}

.message-row.assistant .bubble {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-top-left-radius: 4px;
}

.message-row.user .bubble {
  background: #3b82f6;
  color: #ffffff;
  border-top-right-radius: 4px;
  box-shadow: 0 4px 15px -3px rgba(59, 130, 246, 0.4);
}

.text-content {
  white-space: pre-wrap;
}

/* Markdown rendered content styles */
.text-content :deep(p) {
  margin: 0.4em 0;
}
.text-content :deep(p:first-child) {
  margin-top: 0;
}
.text-content :deep(p:last-child) {
  margin-bottom: 0;
}
.text-content :deep(code) {
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.88em;
  font-family: 'Fira Code', 'Consolas', monospace;
}
.text-content :deep(pre) {
  background: #1e293b;
  color: #e2e8f0;
  padding: 12px 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0.5em 0;
}
.text-content :deep(pre code) {
  background: none;
  padding: 0;
  color: inherit;
}
.text-content :deep(table) {
  border-collapse: collapse;
  margin: 0.5em 0;
  width: 100%;
}
.text-content :deep(th),
.text-content :deep(td) {
  border: 1px solid #e2e8f0;
  padding: 6px 10px;
  text-align: left;
}
.text-content :deep(th) {
  background: #f8fafc;
  font-weight: 600;
}
.text-content :deep(strong) {
  font-weight: 600;
}
.text-content :deep(ul),
.text-content :deep(ol) {
  padding-left: 1.5em;
  margin: 0.4em 0;
}

/* Error block */
.error-text {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ef4444;
  font-weight: 600;
  background: #fef2f2;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #fee2e2;
  flex-wrap: wrap;
}

.error-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  padding: 4px 12px;
  border: 1px solid #fca5a5;
  background: white;
  border-radius: 6px;
  color: #ef4444;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.retry-btn:hover {
  background: #fef2f2;
  border-color: #ef4444;
}

.retry-btn svg {
  width: 14px;
  height: 14px;
}

/* Meta info */
.bubble-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 4px 0;
  font-size: 0.75rem;
  color: #94a3b8;
}

.message-row.user .bubble-meta {
  justify-content: flex-end;
}

.meta-duration {
  color: #3b82f6;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Data view toggle (table/chart) */
.data-view {
  width: 100%;
}

.view-toggle {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.toggle-btn {
  padding: 4px 12px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #64748b;
  font-family: inherit;
}

.toggle-btn.active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #3b82f6;
  font-weight: 500;
}

.toggle-btn:hover:not(.active) {
  background: #f8fafc;
}
</style>
