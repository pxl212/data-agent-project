<template>
  <div class="chart-container">
    <!-- Chart type selector -->
    <div class="chart-toolbar">
      <div class="chart-types">
        <button
          v-for="t in availableTypes"
          :key="t.key"
          :class="['type-btn', { active: chartType === t.key }]"
          @click="chartType = t.key"
          :title="t.label"
        >
          {{ t.icon }}
        </button>
      </div>
      <button class="download-btn" @click="downloadChart" title="下载图表">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>
    </div>
    <div ref="chartEl" class="chart-canvas"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] }
})

const chartEl = ref(null)
const chartType = ref('bar')
let chartInstance = null

// Determine which columns are numeric vs categorical
const analysis = computed(() => {
  if (!props.rows.length || !props.columns.length) return null

  const numericCols = []
  const categoryCols = []

  for (const col of props.columns) {
    const values = props.rows.map(r => r[col])
    const numericCount = values.filter(v => !isNaN(Number(v)) && v !== null && v !== '').length
    if (numericCount > values.length * 0.7) {
      numericCols.push(col)
    } else {
      categoryCols.push(col)
    }
  }

  return { numericCols, categoryCols }
})

const availableTypes = computed(() => {
  const types = [
    { key: 'bar', icon: '📊', label: '柱状图' },
    { key: 'line', icon: '📈', label: '折线图' },
    { key: 'pie', icon: '🥧', label: '饼图' }
  ]
  return types
})

function buildOption() {
  const { numericCols, categoryCols } = analysis.value || { numericCols: [], categoryCols: [] }
  if (!numericCols.length) return null

  const categoryCol = categoryCols[0] || props.columns[0]
  const categories = props.rows.map(r => String(r[categoryCol] ?? ''))

  if (chartType.value === 'pie') {
    // Use first numeric column for pie
    const valCol = numericCols[0]
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, type: 'scroll' },
      series: [{
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{d}%' },
        data: props.rows.map(r => ({
          name: String(r[categoryCol] ?? ''),
          value: Number(r[valCol]) || 0
        }))
      }]
    }
  }

  // Bar or Line
  const series = numericCols.map(col => ({
    name: col,
    type: chartType.value,
    data: props.rows.map(r => Number(r[col]) || 0),
    smooth: chartType.value === 'line',
    barMaxWidth: 40,
    itemStyle: { borderRadius: chartType.value === 'bar' ? [4, 4, 0, 0] : 0 }
  }))

  return {
    tooltip: { trigger: 'axis' },
    legend: numericCols.length > 1 ? { bottom: 0, type: 'scroll' } : undefined,
    grid: { left: 20, right: 20, top: 20, bottom: numericCols.length > 1 ? 40 : 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        rotate: categories.some(c => c.length > 4) ? 30 : 0,
        fontSize: 12
      }
    },
    yAxis: { type: 'value' },
    series,
    color: ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#22c55e']
  }
}

function renderChart() {
  if (!chartEl.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartEl.value)
  }
  const option = buildOption()
  if (option) {
    chartInstance.setOption(option, true)
  }
}

function downloadChart() {
  if (!chartInstance) return
  const url = chartInstance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' })
  const a = document.createElement('a')
  a.href = url
  a.download = 'chart.png'
  a.click()
}

let resizeObserver = null

onMounted(async () => {
  await nextTick()
  renderChart()

  resizeObserver = new ResizeObserver(() => {
    chartInstance?.resize()
  })
  if (chartEl.value) {
    resizeObserver.observe(chartEl.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  chartInstance?.dispose()
  chartInstance = null
})

watch(chartType, () => renderChart())
watch(() => [props.columns, props.rows], () => renderChart(), { deep: true })
</script>

<style scoped>
.chart-container {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.chart-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.chart-types {
  display: flex;
  gap: 4px;
}

.type-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  padding: 0;
}

.type-btn.active {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 0 0 1px #3b82f6;
}

.type-btn:hover:not(.active) {
  background: #f1f5f9;
}

.download-btn {
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

.download-btn:hover {
  background: #e2e8f0;
  color: #334155;
}

.download-btn svg {
  width: 16px;
  height: 16px;
}

.chart-canvas {
  width: 100%;
  height: 300px;
}
</style>
