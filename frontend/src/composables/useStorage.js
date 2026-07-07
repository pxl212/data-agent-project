import { ref, watch } from 'vue'

const STORAGE_KEY = 'data-agent-conversations'

/**
 * Generate a short unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

/**
 * Get group label for a date
 */
function getDateGroup(timestamp) {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const isSameDay = now.toDateString() === date.toDateString()
    if (isSameDay) return '今天'
    return '昨天'
  }
  if (diffDays === 1) return '昨天'
  if (diffDays <= 7) return '最近 7 天'
  if (diffDays <= 30) return '最近 30 天'
  return '更早'
}

export function useStorage() {
  const conversations = ref([])
  const activeConversationId = ref(null)

  // Load from localStorage
  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        conversations.value = parsed.conversations || []
        activeConversationId.value = parsed.activeId || null
      }
    } catch {
      conversations.value = []
      activeConversationId.value = null
    }

    // Ensure at least one conversation
    if (conversations.value.length === 0) {
      createConversation()
    } else if (!activeConversationId.value) {
      activeConversationId.value = conversations.value[0].id
    }
  }

  // Save to localStorage
  function saveToStorage() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          conversations: conversations.value,
          activeId: activeConversationId.value
        })
      )
    } catch {
      // Storage full or unavailable
    }
  }

  // Create a new conversation
  function createConversation() {
    const conv = {
      id: generateId(),
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    conversations.value.unshift(conv)
    activeConversationId.value = conv.id
    saveToStorage()
    return conv
  }

  // Get the active conversation
  function getActiveConversation() {
    return conversations.value.find((c) => c.id === activeConversationId.value)
  }

  // Switch to a conversation
  function switchConversation(id) {
    activeConversationId.value = id
    saveToStorage()
  }

  // Rename a conversation
  function renameConversation(id, newTitle) {
    const conv = conversations.value.find((c) => c.id === id)
    if (conv) {
      conv.title = newTitle
      saveToStorage()
    }
  }

  // Delete a conversation
  function deleteConversation(id) {
    conversations.value = conversations.value.filter((c) => c.id !== id)
    if (activeConversationId.value === id) {
      if (conversations.value.length === 0) {
        createConversation()
      } else {
        activeConversationId.value = conversations.value[0].id
      }
    }
    saveToStorage()
  }

  // Update messages for a specific conversation
  function updateMessages(id, messages) {
    const conv = conversations.value.find((c) => c.id === id)
    if (conv) {
      conv.messages = messages
      conv.updatedAt = Date.now()
      // Auto-generate title from first user message
      if (conv.title === '新对话') {
        const firstUserMsg = messages.find((m) => m.role === 'user' && m.type === 'text')
        if (firstUserMsg) {
          conv.title = firstUserMsg.content.slice(0, 30)
        }
      }
      saveToStorage()
    }
  }

  // Get conversations grouped by date
  function getGroupedConversations() {
    const groups = {}
    const sortedConvs = [...conversations.value].sort((a, b) => b.updatedAt - a.updatedAt)
    for (const conv of sortedConvs) {
      const group = getDateGroup(conv.updatedAt)
      if (!groups[group]) groups[group] = []
      groups[group].push(conv)
    }
    return groups
  }

  // Initialize
  loadFromStorage()

  return {
    conversations,
    activeConversationId,
    createConversation,
    getActiveConversation,
    switchConversation,
    renameConversation,
    deleteConversation,
    updateMessages,
    getGroupedConversations,
    saveToStorage
  }
}
