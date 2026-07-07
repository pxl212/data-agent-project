<template>
  <div class="sidebar-wrapper">
    <!-- Mobile Overlay -->
    <div v-if="mobileOpen" class="mobile-overlay" @click="$emit('close-mobile')"></div>
    
    <div :class="['sidebar', { collapsed, 'is-mobile': mobileOpen }]">
    <!-- Header -->
    <div class="sidebar-header">
      <button class="new-chat-btn" @click="$emit('new')" :title="collapsed ? '新对话' : ''">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span v-if="!collapsed">新对话</span>
      </button>
      <button class="collapse-btn" @click="collapsed = !collapsed" :title="collapsed ? '展开侧边栏' : '收起侧边栏'">
        <svg v-if="collapsed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="13 17 18 12 13 7"></polyline>
          <polyline points="6 17 11 12 6 7"></polyline>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="11 17 6 12 11 7"></polyline>
          <polyline points="18 17 13 12 18 7"></polyline>
        </svg>
      </button>
    </div>

    <!-- Conversation List -->
    <div class="sidebar-content" v-show="!collapsed">
      <div v-for="(group, groupName) in groupedConversations" :key="groupName" class="conv-group">
        <div class="group-title">{{ groupName }}</div>
        <div
          v-for="conv in group"
          :key="conv.id"
          :class="['conv-item', { active: conv.id === activeId }]"
          @click="() => { $emit('select', conv.id); $emit('close-mobile'); }"
        >
          <svg class="chat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          
          <div v-if="editingId === conv.id" class="edit-wrapper" @click.stop>
            <input
              ref="editInput"
              v-model="editTitle"
              @blur="saveEdit(conv.id)"
              @keydown.enter="saveEdit(conv.id)"
              @keydown.esc="cancelEdit"
              class="edit-input"
            />
          </div>
          <span v-else class="conv-title" :title="conv.title">{{ conv.title }}</span>

          <div class="conv-actions" v-if="conv.id === activeId && editingId !== conv.id">
            <button class="action-btn" @click.stop="startEdit(conv)" title="重命名">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="action-btn delete" @click.stop="$emit('delete', conv.id)" title="删除">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="Object.keys(groupedConversations).length === 0" class="empty-state">
        暂无对话
      </div>
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  groupedConversations: { type: Object, required: true },
  activeId: { type: String, default: null },
  mobileOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['new', 'select', 'delete', 'rename', 'close-mobile'])

const collapsed = ref(false)

// Editing state
const editingId = ref(null)
const editTitle = ref('')
const editInput = ref(null)

function startEdit(conv) {
  editingId.value = conv.id
  editTitle.value = conv.title
  nextTick(() => {
    if (editInput.value && editInput.value.length > 0) {
      editInput.value[0].focus()
    }
  })
}

function saveEdit(id) {
  if (editingId.value !== id) return
  const title = editTitle.value.trim()
  if (title) {
    emit('rename', id, title)
  }
  editingId.value = null
}

function cancelEdit() {
  editingId.value = null
}
</script>

<style scoped>
.sidebar-wrapper {
  display: flex;
  height: 100%;
}

.mobile-overlay {
  display: none;
}

.sidebar {
  width: 260px;
  height: 100%;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease, transform 0.3s ease;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
  z-index: 20;
}

@media (max-width: 768px) {
  .sidebar-wrapper {
    position: absolute;
    z-index: 100;
  }
  
  .mobile-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 90;
  }
  
  .sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 100;
    transform: translateX(-100%);
    width: 260px;
    box-shadow: 4px 0 24px rgba(0,0,0,0.1);
  }
  
  .sidebar.is-mobile {
    transform: translateX(0);
  }
  
  .sidebar.collapsed {
    width: 260px; /* Don't change width on mobile */
  }
  
  .collapse-btn {
    display: none; /* Hide collapse on mobile */
  }
}

.sidebar.collapsed:not(.is-mobile) {
  width: 68px;
}

.sidebar-header {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid transparent;
}

.new-chat-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 36px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0 12px;
  overflow: hidden;
  white-space: nowrap;
}

.sidebar.collapsed .new-chat-btn {
  padding: 0;
}

.new-chat-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.new-chat-btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.collapse-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.collapse-btn:hover {
  background: #e2e8f0;
  color: #334155;
}

.collapse-btn svg {
  width: 18px;
  height: 18px;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.sidebar-content::-webkit-scrollbar {
  width: 4px;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.conv-group {
  margin-bottom: 16px;
}

.group-title {
  padding: 0 8px 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
}

.conv-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 2px;
  position: relative;
}

.conv-item:hover {
  background: #f1f5f9;
}

.conv-item.active {
  background: #eff6ff;
  color: #2563eb;
}

.chat-icon {
  width: 16px;
  height: 16px;
  color: #94a3b8;
  flex-shrink: 0;
}

.conv-item.active .chat-icon {
  color: #3b82f6;
}

.conv-title {
  font-size: 0.88rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.edit-wrapper {
  flex: 1;
  overflow: hidden;
}

.edit-input {
  width: 100%;
  font-size: 0.88rem;
  padding: 2px 4px;
  border: 1px solid #93c5fd;
  border-radius: 4px;
  outline: none;
  background: white;
  color: #1e293b;
  font-family: inherit;
}

.conv-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  background: linear-gradient(90deg, rgba(239, 246, 255, 0) 0%, #eff6ff 20%);
  padding-left: 12px;
}

.conv-item:hover .conv-actions,
.conv-item.active .conv-actions {
  opacity: 1;
}

.action-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}

.action-btn:hover {
  background: #e2e8f0;
  color: #334155;
}

.action-btn.delete:hover {
  background: #fee2e2;
  color: #ef4444;
}

.action-btn svg {
  width: 14px;
  height: 14px;
}

.empty-state {
  text-align: center;
  padding: 32px 0;
  color: #94a3b8;
  font-size: 0.88rem;
}
</style>
