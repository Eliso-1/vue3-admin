<!--
  src/views/dashboard/index.vue —— 数据看板（后台首页）

  页面结构（从上到下）：
  1. 欢迎语 + 周期切换（纯展示）
  2. 四张统计卡片：员工总数 / 在职员工 / 组织部门 / 本月新入职
  3. 月度入职趋势柱状图（ECharts） + 部门人数分布进度条
  4. 最近入职员工列表 + 员工状态分布

  数据来源：
  - getDashboardApi()    一次性返回统计卡片、部门分布、入职趋势
  - getEmployeeListApi() 取员工列表，用于"最近入职"板块
  两个请求用 Promise.all 并行发出，互不等待，整体加载更快。
-->
<script setup>
// computed：计算属性，依赖的数据变化时会自动重新计算
// onMounted：生命周期钩子，组件挂载完成后执行（在这里发起首次请求）
// ref：创建响应式变量
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
// 用户信息 store：欢迎语里显示当前登录人的昵称
import { useUserStore } from '@/stores/user'
import { getDashboardApi } from '@/api/dashboard'
import { getEmployeeListApi } from '@/api/employee'
// ECharts 封装（组合式函数）：传入容器 ref + 配置函数，
// 它会自动完成 初始化 → 数据变化重绘 → 窗口缩放自适应 → 组件卸载销毁
import { useChart } from '@/composables/useChart'

const router = useRouter()
const userStore = useUserStore()

// 整页加载遮罩开关（v-loading 用）
const loading = ref(false)

/**
 * 看板核心数据，结构和后端 /dashboard 接口的返回值保持一致：
 * - stats:           { total, active, left, departmentCount } 四张统计卡片的数字
 * - departmentStats: [{ name, value }] 各部门人数（部门分布进度条用）
 * - hireTrend:       [{ month, count }] 按月入职人数（柱状图用）
 * 先给一个"全 0 / 空数组"的默认值，避免请求回来之前模板读到 undefined 而报错
 */
const data = ref({
    stats: { total: 0, active: 0, left: 0, departmentCount: 0 },
    departmentStats: [],
    hireTrend: []
})

// "最近入职员工"列表（从员工列表接口的结果里挑最近的几条）
const recentEmployees = ref([])

// ---- 展示用的计算属性 ----

// 拼出当前月份字符串，格式形如 "2026-10"
// 注意 getMonth() 返回 0~11（0 = 1 月），所以要 +1；padStart 保证始终两位数
const now = new Date()
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

// 本月入职人数：在 hireTrend 里找当月那条数据，找不到就显示 0（?? 是"空值兜底"写法）
const currentMonthHires = computed(() =>
    data.value.hireTrend.find((item) => item.month === currentMonth)?.count ?? 0
)

// 欢迎语里的称呼：优先显示用户昵称，取不到就显示"管理员"
const greetingName = computed(() => userStore.userInfo?.nickname || '管理员')

// 四张统计卡片的数据
// label=标题 value=数字 icon=图标名（全局已注册，可直接当组件用） detail=底部小字
const cards = computed(() => [
    { label: '员工总数', value: data.value.stats.total, icon: 'User', detail: '全部员工' },
    { label: '在职员工', value: data.value.stats.active, icon: 'Calendar', detail: '当前状态为在职' },
    { label: '组织部门', value: data.value.stats.departmentCount, icon: 'Grid', detail: '已登记部门' },
    { label: '本月新入职', value: currentMonthHires.value, icon: 'TrendCharts', detail: '本月入职人数' }
])

/**
 * 部门人数分布（右侧进度条列表）
 * 做了几件事：
 * 1. reduce 算出所有部门总人数，用于计算百分比
 * 2. Math.max(...map) 找出人数最多的部门，作为进度条的"满格"基准
 *    （这样第一名是 100%，其他部门按相对比例显示，条形图更好看）
 * 3. 按人数从多到少排序，只取前 4 名
 * 4. 给每个部门分配一个颜色（取模循环，颜色数组用完就从头再来）
 */
const departments = computed(() => {
    const total = data.value.departmentStats.reduce((sum, item) => sum + item.value, 0)
    const maxCount = Math.max(0, ...data.value.departmentStats.map((item) => item.value))
    const colors = ['#16b89a', '#20b8d2', '#8b72ed', '#f4ad37', '#ea7183']

    return [...data.value.departmentStats]
        .sort((a, b) => b.value - a.value)
        .slice(0, 4)
        .map((item, index) => ({
            ...item,
            percent: total ? (item.value / total) * 100 : 0,          // 占全体员工的百分比
            relativePercent: maxCount ? (item.value / maxCount) * 100 : 0, // 相对第一名的百分比
            color: colors[index % colors.length]
        }))
})

// 员工状态分布（在职/离职两行进度条），并算出各自占总人数的百分比
const employeeStatus = computed(() => {
    const total = data.value.stats.total
    return [
        { label: '在职员工', value: data.value.stats.active, color: '#14b889' },
        { label: '离职员工', value: data.value.stats.left, color: '#c4c6ca' }
    ].map((item) => ({
        ...item,
        percent: total ? (item.value / total) * 100 : 0
    }))
})

// ---- ECharts 柱状图：月度入职趋势 ----
// 传入容器 ref + 一个"返回配置对象"的函数：
// 当函数里用到的响应式数据（data.value.hireTrend）变化时，图表会自动重绘
const chartRef = ref()
useChart(chartRef, () => ({
    animationDuration: 500, // 入场动画时长（毫秒）
    // tooltip：鼠标悬停时的提示框；axis 触发 = 按整根柱子提示；shadow = 阴影指示器
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    // grid：坐标系在整个容器中的留白（防止坐标轴文字被裁掉）
    grid: { left: 44, right: 12, top: 10, bottom: 30, containLabel: true },
    // x 轴：类目轴，显示 "1月、2月..."（month 是 "2026-01"，slice(5) 取 "01"，Number 去掉前导 0）
    xAxis: {
        type: 'category',
        data: data.value.hireTrend.map(({ month }) => `${Number(month.slice(5))}月`),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e8e8e8' } },
        axisLabel: { color: '#777', fontSize: 11, interval: 0 } // interval:0 强制显示所有月份
    },
    // y 轴：数值轴；minInterval:1 保证刻度是整数（人数不会出现 0.5）
    yAxis: {
        type: 'value',
        min: 0,
        minInterval: 1,
        splitLine: { lineStyle: { color: '#dedede', type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#8a8a8a', fontSize: 11 }
    },
    // 柱状图数据
    series: [{
        name: '新入职员工',
        type: 'bar',
        barMaxWidth: 28, // 限制柱子最宽 28px，数据少时不会变成"方块"
        itemStyle: { color: '#242424', borderRadius: [6, 6, 0, 0] }, // 顶部圆角
        data: data.value.hireTrend.map(({ count }) => count)
    }]
}))

/**
 * 加载看板数据
 * Promise.all 把两个请求"并行"发出（同时发，一起等），比串行快一倍
 * 数组解构按顺序对应：[dashboard 接口结果, employee 列表接口结果]
 */
async function loadDashboard() {
    loading.value = true
    try {
        const [dashboard, employeeResult] = await Promise.all([
            getDashboardApi(),
            getEmployeeListApi({ page: 1, pageSize: 10 })
        ])
        data.value = dashboard
        // 最近入职员工：按入职日期从新到旧排序，取前 4 条展示
        recentEmployees.value = [...employeeResult.list]
            .sort((a, b) => b.hireDate.localeCompare(a.hireDate))
            .slice(0, 4)
    } catch (error) {
        // 请求失败时拦截器已经弹过错误提示，这里只做兜底，
        // 避免异常没人接住、在控制台出现 Uncaught (in promise) 红字
        console.warn('看板数据加载失败:', error.message)
    } finally {
        loading.value = false
    }
}

// 组件挂载完成后发起首次请求
onMounted(loadDashboard)
</script>

<template>
    <!-- v-loading：loading 为 true 时整页显示加载遮罩 -->
    <div class="dashboard" v-loading="loading">
        <!-- ① 欢迎区 -->
        <section class="welcome">
            <div>
                <h1>早上好，{{ greetingName }}。</h1>
                <p>组织运行状态良好 <span class="welcome-separator">·</span> 当前员工数据已同步</p>
            </div>
            <!-- 周期切换：目前只是静态样式，还没接数据筛选逻辑 -->
            <div class="period-switch" aria-label="数据周期">
                <span>今日</span>
                <span class="selected">7天</span>
                <span>30天</span>
            </div>
        </section>

        <!-- ② 统计卡片：v-for 循环渲染 cards 数组，:key 用唯一字段帮助 Vue 高效更新 -->
        <section class="stats-grid" aria-label="员工概况">
            <article v-for="card in cards" :key="card.label" class="stat-card">
                <div class="stat-icon">
                    <!-- 动态组件：图标名存在数据里，用 <component :is> 渲染 -->
                    <el-icon><component :is="card.icon" /></el-icon>
                </div>
                <div class="stat-content">
                    <div class="stat-label">{{ card.label }}</div>
                    <div class="stat-value">{{ card.value }}</div>
                    <div class="stat-detail">{{ card.detail }}</div>
                </div>
            </article>
        </section>

        <!-- ③ 趋势图 + 部门分布 -->
        <section class="overview-grid">
            <!-- 左：ECharts 柱状图，ref="chartRef" 对应 script 里的 chartRef -->
            <article class="panel trend-panel">
                <header class="panel-header">
                    <div>
                        <h2>月度新入职趋势</h2>
                        <p>按月统计员工入职人数</p>
                    </div>
                    <div class="legend"><i></i> 新入职员工</div>
                </header>
                <!-- 图表容器：必须给定高度，否则 ECharts 量不到尺寸画不出来 -->
                <div ref="chartRef" class="trend-chart" />
            </article>

            <!-- 右：部门人数分布进度条 -->
            <article class="panel department-panel">
                <header class="panel-header">
                    <h2>部门人数分布</h2>
                    <button class="text-link" type="button" @click="router.push('/department')">
                        查看全部 <el-icon><ArrowRight /></el-icon>
                    </button>
                </header>
                <!-- v-if / v-else：有数据渲染列表，没数据显示空状态占位 -->
                <div v-if="departments.length" class="department-list">
                    <div v-for="department in departments" :key="department.name" class="department-item">
                        <div class="department-info">
                            <span class="department-name">
                                <i :style="{ backgroundColor: department.color }"></i>
                                {{ department.name }}
                            </span>
                            <strong>{{ department.percent.toFixed(1) }}%</strong>
                        </div>
                        <!-- 进度条：宽度 = 相对第一名的百分比（第一名正好撑满） -->
                        <div class="progress-track">
                            <span
                                :style="{
                                    width: `${department.relativePercent}%`,
                                    backgroundColor: department.color
                                }"
                            />
                        </div>
                        <small>{{ department.value }} 名员工</small>
                    </div>
                </div>
                <el-empty v-else description="暂无部门数据" :image-size="64" />
            </article>
        </section>

        <!-- ④ 最近入职 + 状态分布 -->
        <section class="bottom-grid">
            <!-- 最近入职员工列表 -->
            <article class="panel lower-panel">
                <header class="panel-header">
                    <h2>最近入职员工</h2>
                    <button class="text-link" type="button" @click="router.push('/employee')">
                        查看全部 <el-icon><ArrowRight /></el-icon>
                    </button>
                </header>
                <div v-if="recentEmployees.length" class="recent-list">
                    <div v-for="employee in recentEmployees" :key="employee.id" class="recent-item">
                        <!-- 头像显示姓名最后一个字 -->
                        <el-avatar :size="36">{{ employee.name.slice(-1) }}</el-avatar>
                        <div class="recent-details">
                            <strong>{{ employee.name }}</strong>
                            <span>{{ employee.departmentName || '未分配部门' }}</span>
                        </div>
                        <time>{{ employee.hireDate }}</time>
                    </div>
                </div>
                <el-empty v-else description="暂无员工数据" :image-size="64" />
            </article>

            <!-- 在职/离职占比 -->
            <article class="panel lower-panel">
                <header class="panel-header">
                    <h2>员工状态分布</h2>
                    <span class="subtle-label">{{ data.stats.total }} 名员工</span>
                </header>
                <div class="status-list">
                    <div v-for="item in employeeStatus" :key="item.label" class="status-item">
                        <div class="status-info">
                            <span><i :style="{ backgroundColor: item.color }" />{{ item.label }}</span>
                            <strong>{{ item.value }}</strong>
                        </div>
                        <!-- 这里的进度条宽度是"占总人数的真实百分比" -->
                        <div class="progress-track">
                            <span :style="{ width: `${item.percent}%`, backgroundColor: item.color }" />
                        </div>
                    </div>
                </div>
            </article>
        </section>
    </div>
</template>

<style lang="scss" scoped>
/* ===== 整体容器：限制最大宽度并水平居中，超宽屏下不会拉得太开 ===== */
.dashboard {
    max-width: 1600px;
    margin: 0 auto;
}

/* ===== ① 欢迎区 ===== */
.welcome {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 24px;

    h1 {
        color: #1d1d1f;
        font-size: 28px;
        font-weight: 720;
        letter-spacing: -0.8px;
        line-height: 1.25;
    }

    p {
        margin-top: 7px;
        color: #858585;
        font-size: 14px;
    }
}

.welcome-separator {
    padding: 0 3px;
}

/* 周期切换（今日/7天/30天）胶囊样式 */
.period-switch {
    display: flex;
    align-items: center;
    padding: 3px;
    border: 1px solid #e6e5e3;
    border-radius: 11px;
    background: #fff;

    span {
        min-width: 48px;
        padding: 8px 11px;
        border-radius: 7px;
        color: #4a4a4a;
        font-size: 12px;
        text-align: center;
    }

    /* 当前选中的项：黑底白字 */
    .selected {
        background: #202020;
        color: #fff;
        font-weight: 600;
    }
}

/* ===== ② 统计卡片：4 列网格 ===== */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 22px;
}

/* 卡片和面板共用的"白底圆角描边"外观 */
.stat-card,
.panel {
    border: 1px solid #e9e8e6;
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 1px 2px rgb(25 25 25 / 3%);
}

.stat-card {
    display: flex;
    align-items: flex-start;
    gap: 13px;
    min-height: 122px;
    padding: 18px;
}

/* 左侧图标方块 */
.stat-icon {
    display: grid;
    width: 44px;
    height: 44px;
    flex: 0 0 44px;
    place-items: center;
    border-radius: 12px;
    background: #f5f5f3;
    color: #242424;
    font-size: 18px;
}

.stat-content {
    min-width: 0; /* 配合下面的 ellipsis，防止长文字把卡片撑破 */
}

.stat-label {
    overflow: hidden;
    color: #777;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 大数字 */
.stat-value {
    margin-top: 5px;
    color: #1c1c1c;
    font-size: 27px;
    font-weight: 700;
    letter-spacing: -0.5px;
    line-height: 1.2;
}

.stat-detail {
    margin-top: 10px;
    color: #999;
    font-size: 11px;
}

/* ===== ③④ 两个双栏网格：左宽右窄 ===== */
.overview-grid,
.bottom-grid {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(270px, 1fr);
    gap: 18px;
}

.bottom-grid {
    margin-top: 18px;
}

.panel {
    min-width: 0;
    padding: 17px 19px;
}

/* 给上面两个面板固定最小高度，避免图表加载时高度跳动 */
.trend-panel,
.department-panel {
    min-height: 376px;
}

/* 面板标题行：左边标题、右边"查看全部"链接，两端对齐 */
.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;

    h2 {
        color: #222;
        font-size: 14px;
        font-weight: 650;
    }

    p {
        margin-top: 4px;
        color: #8a8a8a;
        font-size: 11px;
    }
}

/* 图例小圆点 */
.legend {
    display: flex;
    align-items: center;
    gap: 7px;
    color: #777;
    font-size: 11px;

    i {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #242424;
    }
}

/* 图表容器：必须指定高度，ECharts 才能正常渲染 */
.trend-chart {
    width: 100%;
    height: 300px;
}

/* "查看全部"文字链接按钮：重置 button 默认样式 */
.text-link {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 3px 0;
    border: 0;
    background: transparent;
    color: #888;
    cursor: pointer;
    font: inherit;
    font-size: 11px;

    &:hover {
        color: #222;
    }
}

/* ===== 部门分布列表 ===== */
.department-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding-top: 11px;
}

/* 名称+百分比 一行，两端对齐（状态分布也复用这个样式） */
.department-info,
.status-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;

    strong {
        color: #242424;
        font-size: 12px;
        font-weight: 650;
    }
}

/* 名称前的小色块 */
.department-name,
.status-info > span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #333;
    font-size: 12px;

    i {
        width: 7px;
        height: 7px;
        flex: 0 0 7px;
        border-radius: 50%;
    }
}

/* 进度条轨道 + 彩色填充 */
.progress-track {
    height: 5px;
    margin-top: 9px;
    overflow: hidden;
    border-radius: 999px;
    background: #efefed;

    span {
        display: block;
        height: 100%;
        border-radius: inherit; /* 继承父级的圆角 */
    }
}

.department-item small {
    display: block;
    margin-top: 8px;
    color: #969696;
    font-size: 10px;
}

/* ===== ④ 底部两个面板 ===== */
.lower-panel {
    min-height: 190px;
}

.recent-list,
.status-list {
    display: flex;
    flex-direction: column;
}

/* 最近入职的每一行 */
.recent-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 0;
    border-bottom: 1px solid #f1f0ee;

    /* 最后一行不要分割线（& 代表父选择器 .recent-item） */
    &:last-child {
        border-bottom: 0;
    }

    /* :deep() 可以穿透 scoped 限制，改到子组件内部的元素 */
    :deep(.el-avatar) {
        background: #f2e9e6;
        color: #a25f4d;
        font-size: 13px;
    }

    /* 时间靠右：margin-left:auto 把自己推到行尾 */
    time {
        margin-left: auto;
        color: #999;
        font-size: 10px;
    }
}

.recent-details {
    display: flex;
    flex-direction: column;
    gap: 3px;

    strong {
        color: #333;
        font-size: 12px;
        font-weight: 600;
    }

    span {
        color: #929292;
        font-size: 10px;
    }
}

.status-list {
    gap: 18px;
    padding-top: 10px;
}

.subtle-label {
    color: #929292;
    font-size: 11px;
}

/* ===== 响应式：屏幕变窄时逐级降列 ===== */

/* ≤1100px：统计卡片 4 列变 2 列，双栏比例收紧 */
@media (max-width: 1100px) {
    .stats-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .overview-grid,
    .bottom-grid {
        grid-template-columns: minmax(0, 1.5fr) minmax(240px, 1fr);
    }
}

/* ≤760px：欢迎区竖排，双栏变单栏 */
@media (max-width: 760px) {
    .welcome {
        align-items: flex-start;
        flex-direction: column;
    }

    .welcome h1 {
        font-size: 24px;
    }

    .overview-grid,
    .bottom-grid {
        grid-template-columns: minmax(0, 1fr);
    }

    .trend-panel,
    .department-panel {
        min-height: auto;
    }

    .trend-chart {
        height: 260px;
    }
}

/* ≤480px（手机）：进一步压缩卡片尺寸 */
@media (max-width: 480px) {
    .stats-grid {
        gap: 10px;
    }

    .stat-card {
        min-height: 105px;
        gap: 9px;
        padding: 12px;
    }

    .stat-icon {
        width: 36px;
        height: 36px;
        flex-basis: 36px;
        font-size: 15px;
    }

    .stat-value {
        font-size: 23px;
    }
}
</style>
