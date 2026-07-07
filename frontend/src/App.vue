<template>
  <div class="app-layout">
    <Sidebar
      :groupedConversations="groupedConversations"
      :activeId="storage.activeConversationId.value"
      :mobileOpen="showMobileSidebar"
      @new="storage.createConversation()"
      @select="storage.switchConversation"
      @rename="storage.renameConversation"
      @delete="storage.deleteConversation"
      @close-mobile="showMobileSidebar = false"
    />

    <div class="chat-page">
      <!-- 背景装饰 -->
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>

      <!-- Mobile Header -->
      <div class="mobile-header">
        <button class="menu-btn" @click="showMobileSidebar = true" title="打开侧边栏">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div class="mobile-title">Data Agent</div>
        <div class="mobile-header-placeholder"></div>
      </div>

      <div class="chat-container">
        <!-- 欢迎页 (Empty State) -->
        <WelcomeScreen
          v-if="messages.length === 0"
          :suggestedQueries="suggestedQueries"
          @select="useSuggestedQuery"
        />

        <!-- 消息区 -->
        <div v-else ref="messagesEl" class="messages">
          <MessageBubble
            v-for="(msg, index) in messages"
            :key="index"
            :msg="msg"
            :formatTime="formatTime"
            :formatDuration="formatDuration"
            :enableTypewriter="msg._typewriter || false"
            @retry="retryMessage"
          />
          <div class="messages-bottom-spacer"></div>
        </div>
      </div>

      <!-- 悬浮输入框 -->
      <InputBar
        v-model="question"
        :loading="loading"
        @send="handleSend"
        @stop="stopGeneration"
        @history-up="navigateHistory('up')"
        @history-down="navigateHistory('down')"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useChat } from './composables/useChat.js'
import Sidebar from './components/Sidebar.vue'
import WelcomeScreen from './components/WelcomeScreen.vue'
import MessageBubble from './components/MessageBubble.vue'
import InputBar from './components/InputBar.vue'

const showMobileSidebar = ref(false)
const messagesEl = ref(null)

const {
  storage,
  messages,
  loading,
  question,
  sendQuestion,
  useSuggestedQuery,
  stopGeneration,
  retryMessage,
  navigateHistory,
  formatTime,
  formatDuration
} = useChat()

const groupedConversations = computed(() => storage.getGroupedConversations())

const suggestedQueries = [
  '查询华东地区销量前三的商品',
  '查看2025年各季度的GMV走势',
  '不同会员等级的平均客单价是多少？'
]

function scrollToBottom() {
  const el = messagesEl.value
  if (!el) return
  el.scrollTo({
    top: el.scrollHeight,
    behavior: 'smooth'
  })
}

function handleSend() {
  sendQuestion(scrollToBottom)
}
</script>

<style scoped>
/* 全局重置与字体 */
:global(html),
:global(body) {
  height: 100%;
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  background-color: #f8fafc;
  color: #1e293b;
}

:global(body) {
  display: block !important;
  place-items: unset !important;
}

:global(#app) {
  height: 100%;
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

.app-layout {
  display: flex;
  height: 100%;
  width: 100vw;
  overflow: hidden;
}

/* 页面容器 */
.chat-page {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

.chat-container {
  height: 100%;
  max-width: 900px;
  margin: 0 auto;
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
}

/* 装饰性背景 */
.bg-shape {
  position: absolute;
  filter: blur(100px);
  z-index: 1;
  opacity: 0.5;
}
.shape-1 {
  top: -10%;
  left: -5%;
  width: 500px;
  height: 500px;
  background: rgba(56, 189, 248, 0.4);
  border-radius: 50%;
}
.shape-2 {
  bottom: -10%;
  right: -5%;
  width: 600px;
  height: 600px;
  background: rgba(129, 140, 248, 0.3);
  border-radius: 50%;
}

/* 消息区 */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 2rem 1rem 120px;
  scroll-behavior: smooth;
}
.messages::-webkit-scrollbar {
  width: 6px;
}
.messages::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.5);
  border-radius: 3px;
}

.messages-bottom-spacer {
  height: 60px;
}

/* Mobile Header */
.mobile-header {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #e2e8f0;
  position: relative;
  z-index: 10;
}

.menu-btn {
  background: transparent;
  border: none;
  color: #334155;
  cursor: pointer;
  padding: 4px;
  display: flex;
}

.menu-btn svg {
  width: 24px;
  height: 24px;
}

.mobile-title {
  font-weight: 600;
  color: #1e293b;
  font-size: 1.1rem;
}

.mobile-header-placeholder {
  width: 32px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .mobile-header {
    display: flex;
  }
  
  .messages {
    padding: 1rem 0.5rem 100px;
  }
}
</style>
