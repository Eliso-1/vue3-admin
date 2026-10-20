<!--
  src/views/dashboard/index.vue —— 数据看板页面

  布局：
  ┌──────────┬──────────┬──────────┬──────────┐
  │ 员工总数 │ 在职人数 │ 离职人数 │ 部门数量 │  ← 统计卡片（4 列）
  └──────────┴──────────┴──────────┴──────────┘
  ┌────────────────────┬───────────────────────┐
  │   部门人员分布      │    月度入职趋势        │
  │    （饼图）         │    （柱状图）          │
  └────────────────────┴───────────────────────┘

  数据全部来自接口 GET /api/dashboard，页面挂载后请求一次即可。
-->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { getDashboardApi } from '@/api/dashboard'
// 导入封装好的 ECharts 图表组合式函数
import { useChart } from '@/composables/useChart'

// 页面整体的 loading 状态（控制 v-loading 遮罩）
const loading = ref(false)

/**
 * 看板数据（接口返回的完整数据结构）
 * 提前给定默认值，防止数据还没加载完时模板访问属性报错
 */
const data = ref({
    stats: { total: 0, active: 0, left: 0, departmentCount: 0 },
    departmentStats: [],  // 各部门人数列表，供饼图使用
    hireTrend: []         // 按月入职人数列表，供柱状图使用
})

/**
 * 顶部四张统计卡片的配置
 * 使用 computed 是因为 data.value 是响应式的，数据加载完成后卡片数字会自动更新
 */
const cards = computed(() => [
    { label: '员工总数', value: data.value.stats.total,           color: '#409eff' },
    { label: '在职人数', value: data.value.stats.active,          color: '#67c23a' },
    { label: '离职人数', value: data.value.stats.left,            color: '#909399' },
    { label: '部门数量', value: data.value.stats.departmentCount, color: '#e6a23c' }
])

// 图表容器元素的 ref（在模板里用 ref="pieRef" / ref="barRef" 绑定到 div 上）
const pieRef = ref()
const barRef = ref()

/**
 * 部门人员分布——环形饼图
 *
 * useChart 的第二个参数是一个"getter 函数"，它的返回值就是 ECharts 的 option 配置。
 * 当 data.value.departmentStats 变化时（接口返回数据后），
 * Vue 会自动重新调用这个函数，图表随之更新。
 */
useChart(pieRef, () => ({
    tooltip: { trigger: 'item' },   // 鼠标悬停到每个扇形时显示提示
    legend:  { bottom: 0 },         // 图例放在底部
    series: [
        {
            name:   '部门人数',
            type:   'pie',
            radius: ['45%', '68%'], // 内外半径，形成环形图（内圆 45%，外圆 68%）
            data:   data.value.departmentStats  // [{ name: '研发部', value: 10 }, ...]
        }
    ]
}))

/**
 * 月度入职趋势——柱状图
 */
useChart(barRef, () => ({
    tooltip: { trigger: 'axis' },  // 鼠标悬停到坐标轴时显示所有系列的提示
    grid:    { left: 40, right: 20, top: 30, bottom: 30 },  // 图表与容器的内边距
    xAxis: {
        type: 'category',
        // 从 hireTrend 数组中提取月份作为 X 轴刻度，如 ['2022-01', '2022-02', ...]
        data: data.value.hireTrend.map((i) => i.month)
    },
    yAxis: {
        type: 'value',
        minInterval: 1  // Y 轴最小刻度为 1（人数是整数，不显示小数刻度）
    },
    series: [
        {
            name:       '入职人数',
            type:       'bar',
            barMaxWidth: 36,  // 每根柱子最大宽度，防止数据少时柱子过宽
            // 从 hireTrend 提取每月入职人数作为柱子高度
            data: data.value.hireTrend.map((i) => i.count)
        }
    ]
}))

// 组件挂载后请求看板数据
onMounted(async () => {
    loading.value = true
    try {
        // 接口返回的数据直接赋给 data.value，computed 和 useChart 内的 watch 会自动响应
        data.value = await getDashboardApi()
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <!--
      v-loading：当 loading 为 true 时在整个看板上显示加载遮罩
      遮罩会覆盖在所有图表和卡片上方，数据加载完后自动消失
    -->
    <div v-loading="loading">
        <!-- 第一行：4 张统计卡片 -->
        <!--
          el-row :gutter="16"：列之间留 16px 间距
          el-col :span="6"   ：每列占 24 栅格中的 6 格（24/6=4列）
        -->
        <el-row :gutter="16" class="row">
            <el-col v-for="c in cards" :key="c.label" :span="6">
                <el-card shadow="never">
                    <!-- 卡片标题（如"员工总数"） -->
                    <div class="label">{{ c.label }}</div>
                    <!-- 数字：用不同颜色区分指标类型 -->
                    <div class="value" :style="{ color: c.color }">{{ c.value }}</div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 第二行：饼图（左）+ 柱状图（右） -->
        <el-row :gutter="16">
            <!-- 饼图：占 10/24 格 -->
            <el-col :span="10">
                <el-card shadow="never">
                    <!-- #header 插槽：卡片顶部标题区 -->
                    <template #header>部门人员分布</template>
                    <!--
                      ref="pieRef"：把这个 div 的 DOM 引用传给 useChart，
                      ECharts 会在这个 div 内部绘制图表
                      必须设置 height，否则 ECharts 拿到的容器高度为 0，图表不显示
                    -->
                    <div ref="pieRef" class="chart" />
                </el-card>
            </el-col>
            <!-- 柱状图：占 14/24 格 -->
            <el-col :span="14">
                <el-card shadow="never">
                    <template #header>月度入职趋势</template>
                    <div ref="barRef" class="chart" />
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<style lang="scss" scoped>
/* 第一行卡片与第二行图表之间的间距 */
.row {
    margin-bottom: 16px;
}

/* 卡片标签文字：灰色小字 */
.label {
    color: #909399;
    font-size: 14px;
}

/* 卡片数字：大号加粗，颜色由 :style 动态绑定 */
.value {
    margin-top: 8px;
    font-size: 32px;
    font-weight: bold;
}

/* 图表容器：必须显式设置高度，ECharts 才能正确计算绘制区域 */
.chart {
    height: 320px;
}
</style>
