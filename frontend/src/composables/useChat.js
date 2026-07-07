import { nextTick, ref, computed } from 'vue'
import { useStorage } from './useStorage.js'

const API_URL = '/api/query'

export function useChat() {
  const storage = useStorage()
  
  // Independent loading states per conversation
  const loadings = ref({})
  const loading = computed(() => loadings.value[storage.activeConversationId.value] || false)
  
  // The input box is shared, but independent history per conversation
  const question = ref('')
  const inputHistories = ref({})
  const historyIndexes = ref({})
  
  // Abort controllers mapped by conversation ID
  const abortControllers = {}

  const messages = computed(() => {
    const conv = storage.getActiveConversation()
    return conv ? conv.messages : []
  })

  function updateMessages(id, updater) {
    const conv = storage.conversations.value.find(c => c.id === id)
    if (!conv) return
    updater(conv.messages)
    storage.updateMessages(id, conv.messages)
  }

  function createTimestamp() {
    return Date.now()
  }

  function formatTime(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  function stopGeneration() {
    const id = storage.activeConversationId.value
    if (abortControllers[id]) {
      abortControllers[id].abort()
      delete abortControllers[id]
      loadings.value[id] = false
    }
  }

  async function sendQuestion(onScrollToBottom) {
    const convId = storage.activeConversationId.value
    if (!convId || loadings.value[convId] || !question.value.trim()) return

    const currentQ = question.value.trim()
    question.value = ''

    // Initialize history for this conversation
    if (!inputHistories.value[convId]) inputHistories.value[convId] = []
    if (!inputHistories.value[convId].includes(currentQ)) {
      inputHistories.value[convId].unshift(currentQ)
    }
    historyIndexes.value[convId] = -1

    const startTime = Date.now()
    
    updateMessages(convId, msgs => {
      msgs.push({
        role: 'user',
        type: 'text',
        content: currentQ,
        timestamp: createTimestamp()
      })
    })

    nextTick(() => { if (onScrollToBottom) onScrollToBottom() })

    loadings.value[convId] = true
    abortControllers[convId] = new AbortController()

    let assistantMsgIndex = -1
    
    updateMessages(convId, msgs => {
      msgs.push({
        role: 'assistant',
        type: 'steps',
        steps: [],
        timestamp: createTimestamp(),
        _typewriter: false
      })
      assistantMsgIndex = msgs.length - 1
    })

    nextTick(() => { if (onScrollToBottom) onScrollToBottom() })

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentQ }),
        signal: abortControllers[convId].signal
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const dataStr = trimmed.slice(6)
          if (dataStr === '[DONE]') continue

          try {
            const data = JSON.parse(dataStr)
            updateMessages(convId, msgs => {
              const assistantMsg = msgs[assistantMsgIndex]
              
              if (data.type === 'progress') {
                if (data.step) {
                  const existingStep = assistantMsg.steps.find(s => s.text === data.step)
                  if (existingStep) {
                    existingStep.status = data.status || 'completed'
                  } else {
                    assistantMsg.steps.push({
                      text: data.step,
                      status: data.status || 'running'
                    })
                  }
                }
              } else if (data.type === 'result') {
                assistantMsg.type = 'table'
                assistantMsg.columns = data.columns || (data.data && data.data.length > 0 ? Object.keys(data.data[0]) : [])
                assistantMsg.rows = data.data || []
                assistantMsg.duration = Date.now() - startTime
              } else if (data.type === 'error') {
                assistantMsg.type = 'error'
                assistantMsg.content = data.content || '发生了未知错误'
                assistantMsg.originalQuery = currentQ
                assistantMsg.duration = Date.now() - startTime
              } else {
                assistantMsg.type = 'text'
                assistantMsg.content = (assistantMsg.content || '') + (data.content || '')
                assistantMsg._typewriter = true
              }
            })
            if (convId === storage.activeConversationId.value) {
              nextTick(() => { if (onScrollToBottom) onScrollToBottom() })
            }
          } catch (e) {
            console.error('SSE parse error:', e, dataStr)
          }
        }
      }
      
      updateMessages(convId, msgs => {
        const assistantMsg = msgs[assistantMsgIndex]
        if (assistantMsg.type === 'text') {
          assistantMsg.duration = Date.now() - startTime
        }
      })
    } catch (error) {
      if (error.name === 'AbortError') {
        updateMessages(convId, msgs => {
          const assistantMsg = msgs[assistantMsgIndex]
          assistantMsg.type = 'error'
          assistantMsg.content = '已停止生成。'
          assistantMsg.duration = Date.now() - startTime
        })
      } else {
        console.error('Fetch error:', error)
        updateMessages(convId, msgs => {
          const assistantMsg = msgs[assistantMsgIndex]
          assistantMsg.type = 'error'
          assistantMsg.content = error.message || '请求失败，请检查网络或后端服务。'
          assistantMsg.originalQuery = currentQ
          assistantMsg.duration = Date.now() - startTime
        })
      }
      if (convId === storage.activeConversationId.value) {
        nextTick(() => { if (onScrollToBottom) onScrollToBottom() })
      }
    } finally {
      loadings.value[convId] = false
      delete abortControllers[convId]
    }
  }

  function useSuggestedQuery(q, onScrollToBottom) {
    question.value = q
    sendQuestion(onScrollToBottom)
  }

  function retryMessage(q, onScrollToBottom) {
    question.value = q
    sendQuestion(onScrollToBottom)
  }

  function navigateHistory(direction) {
    const convId = storage.activeConversationId.value
    if (!convId || !inputHistories.value[convId] || inputHistories.value[convId].length === 0) return
    
    if (historyIndexes.value[convId] === undefined) {
      historyIndexes.value[convId] = -1
    }

    const history = inputHistories.value[convId]
    let index = historyIndexes.value[convId]

    if (direction === 'up') {
      if (index < history.length - 1) {
        index++
        question.value = history[index]
      }
    } else {
      if (index > 0) {
        index--
        question.value = history[index]
      } else if (index === 0) {
        index = -1
        question.value = ''
      }
    }
    historyIndexes.value[convId] = index
  }

  return {
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
  }
}
