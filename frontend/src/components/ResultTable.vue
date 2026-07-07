<template>
  <div class="table-container">
    <!-- Toolbar -->
    <div class="table-toolbar">
      <span class="row-count">{{ rows.length }} 条结果</span>
      <div class="toolbar-actions">
        <button class="toolbar-btn" @click="handleCopy" :title="copied ? '已复制！' : '复制到剪贴板'">
          <svg v-if="!copied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
        <button class="toolbar-btn" @click="handleExport" title="导出 CSV">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="table-wrap">
      <table class="result-table">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col"
              @click="toggleSort(col)"
              class="sortable-th"
            >
              <span>{{ col }}</span>
              <span class="sort-icon" v-if="sortKey === col">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rIdx) in displayRows" :key="rIdx">
            <td v-for="col in columns" :key="col">
              {{ row[col] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        class="page-btn"
        :disabled="currentPage === 1"
        @click="currentPage--"
      >‹</button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="currentPage++"
      >›</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { exportCSV, copyToClipboard } from '../utils/export.js'

const props = defineProps({
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] }
})

const PAGE_SIZE = 50
const currentPage = ref(1)
const sortKey = ref(null)
const sortOrder = ref('asc')
const copied = ref(false)

const sortedRows = computed(() => {
  if (!sortKey.value) return props.rows
  return [...props.rows].sort((a, b) => {
    const va = a[sortKey.value]
    const vb = b[sortKey.value]
    // Try numeric comparison
    const na = Number(va)
    const nb = Number(vb)
    if (!isNaN(na) && !isNaN(nb)) {
      return sortOrder.value === 'asc' ? na - nb : nb - na
    }
    // String comparison
    const sa = String(va ?? '')
    const sb = String(vb ?? '')
    return sortOrder.value === 'asc'
      ? sa.localeCompare(sb, 'zh')
      : sb.localeCompare(sa, 'zh')
  })
})

const totalPages = computed(() => Math.ceil(sortedRows.value.length / PAGE_SIZE))

const displayRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return sortedRows.value.slice(start, start + PAGE_SIZE)
})

function toggleSort(col) {
  if (sortKey.value === col) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = col
    sortOrder.value = 'asc'
  }
  currentPage.value = 1
}

function handleExport() {
  exportCSV(props.columns, props.rows)
}

async function handleCopy() {
  await copyToClipboard(props.columns, props.rows)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<style scoped>
.table-container {
  width: 100%;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
}

.row-count {
  font-size: 0.82rem;
  color: #64748b;
  font-weight: 500;
}

.toolbar-actions {
  display: flex;
  gap: 4px;
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
  padding: 0;
}

.toolbar-btn:hover {
  background: #e2e8f0;
  color: #334155;
}

.toolbar-btn svg {
  width: 16px;
  height: 16px;
}

.table-wrap {
  max-width: 100%;
  overflow-x: auto;
  border-radius: 0 0 8px 8px;
  border: 1px solid #e2e8f0;
}

.result-table {
  width: max-content;
  min-width: 100%;
  table-layout: auto;
  border-collapse: collapse;
  background: #ffffff;
}

.result-table th,
.result-table td {
  padding: 10px 16px;
  font-size: 0.9rem;
  text-align: left;
  color: #334155;
}

.sortable-th {
  cursor: pointer;
  user-select: none;
  background: #f8fafc;
  font-weight: 600;
  color: #1e293b;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
  transition: background 0.2s;
}

.sortable-th:hover {
  background: #eef2f7;
}

.sort-icon {
  margin-left: 4px;
  font-size: 0.8rem;
  color: #3b82f6;
}

.result-table tr {
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s;
}

.result-table tbody tr:hover {
  background-color: #f8fafc;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 8px 8px;
  background: #f8fafc;
}

.page-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  color: #334155;
  transition: all 0.2s;
  padding: 0;
}

.page-btn:hover:not(:disabled) {
  background: #e2e8f0;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.85rem;
  color: #64748b;
}
</style>
