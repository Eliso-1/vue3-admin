/**
 * src/composables/useChart.js —— ECharts 图表封装（组合式函数）
 *
 * 解决了什么问题？
 * 每次使用 ECharts 都要手动写：初始化 → 挂载时绘制 → 数据变化时更新 → 窗口缩放时 resize → 卸载时销毁。
 * 把这些重复步骤封装成一个函数，页面只需传入"容器 ref"和"option 配置"就可以了。
 *
 * ECharts 按需引入（Tree Shaking）
 * 直接 import * as echarts from 'echarts' 会把整个库打包进来（体积很大）。
 * 这里改用按需引入：只导入用到的图表类型和组件，大幅减小打包体积。
 */
import { shallowRef, watch, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts/core'
// 按需导入图表类型
import { BarChart, LineChart, PieChart } from 'echarts/charts'
// 按需导入所需组件
import {
    GridComponent,      // 直角坐标系网格（柱状图/折线图必须）
    TooltipComponent,   // 鼠标悬停提示框
    LegendComponent,    // 图例（饼图右侧的颜色说明）
    TitleComponent      // 图表标题
} from 'echarts/components'
// 渲染器：ECharts 支持 Canvas 和 SVG 两种，这里用性能更好的 Canvas
import { CanvasRenderer } from 'echarts/renderers'

// 把所有按需引入的模块注册到 ECharts 核心中（必须调用，否则图表不会渲染）
echarts.use([
    BarChart,
    LineChart,
    PieChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent,
    CanvasRenderer
])

/**
 * 图表组合式函数
 *
 * @param {Ref<HTMLElement>} elRef     图表容器元素的 ref（在模板中用 ref="xxx" 绑定）
 * @param {Function}         getOption 返回 ECharts option 配置对象的函数。
 *                                     当函数内依赖的响应式数据变化时，图表会自动更新。
 * @returns {ShallowRef}  ECharts 实例（一般不需要用到，特殊场景下可以手动调用实例方法）
 *
 * 使用示例：
 *   const chartRef = ref()
 *   useChart(chartRef, () => ({
 *     series: [{ type: 'pie', data: someReactiveData.value }]
 *   }))
 *   // 模板中：<div ref="chartRef" style="height: 300px" />
 */
export function useChart(elRef, getOption) {
    /**
     * 为什么用 shallowRef 而不是 ref？
     * ECharts 实例对象内部属性极多且复杂。
     * 如果用 ref()，Vue 会对它做深度响应式代理，会带来严重的性能问题和意外错误。
     * shallowRef 只对 .value 本身做响应式，不深入代理内部属性，是存放第三方实例的最佳选择。
     */
    const chart = shallowRef(null)

    // ResizeObserver 实例：用于监听容器尺寸变化
    let observer = null

    // 组件挂载后初始化图表（必须等 DOM 渲染完才能拿到容器的真实尺寸）
    onMounted(() => {
        // 初始化 ECharts 实例，绑定到容器 DOM 元素上
        chart.value = echarts.init(elRef.value)
        // 第一次渲染：调用 getOption() 生成 option 并传给 setOption
        chart.value.setOption(getOption())

        /**
         * 监听容器尺寸变化并自动 resize
         * 触发场景：浏览器窗口缩放、侧边栏折叠导致容器宽度改变
         * ResizeObserver 是浏览器原生 API，比监听 window resize 事件更精准
         */
        observer = new ResizeObserver(() => chart.value?.resize())
        observer.observe(elRef.value)
    })

    /**
     * 侦听 getOption 函数本身（作为 getter）
     * 当 getOption 内部依赖的响应式数据（如 data.value）发生变化时，
     * Vue 会重新执行 getOption()，并把新的 option 传给 setOption 更新图表
     */
    watch(getOption, (option) => {
        chart.value?.setOption(option)
    })

    // 组件卸载前清理资源，防止内存泄漏
    onBeforeUnmount(() => {
        observer?.disconnect()   // 停止监听容器尺寸
        chart.value?.dispose()   // 销毁 ECharts 实例，释放 Canvas 内存
    })

    return chart
}
