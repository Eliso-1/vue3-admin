/**
 * src/composables/useTable.js —— 通用表格逻辑复用（组合式函数 / Composable）
 *
 * 什么是 Composable（组合式函数）？
 * 它是 Vue 3 的代码复用方式。把多个页面都需要的"列表加载、分页、搜索、重置"等
 * 重复逻辑提取到这里，各页面直接 import 使用，避免每个页面都写一遍相同的代码。
 *
 * 使用方式：
 * const { loading, tableData, total, query, search, reset, ... } = useTable(fetchApi, options)
 *
 * @param {Function} fetchApi      请求列表数据的接口函数，形如 (params) => request.get('/list', { params })
 * @param {Object}   options       可选配置
 * @param {Object}   options.defaultQuery   搜索表单的默认值对象，决定表单有哪些字段
 * @param {boolean}  options.immediate      是否在组件挂载时立即发起第一次请求，默认 true
 */
import { reactive, ref, onMounted } from 'vue'

export function useTable(fetchApi, { defaultQuery = {}, immediate = true } = {}) {
    // ---- 状态 ----

    const loading   = ref(false)  // 表格的 loading 遮罩开关
    const tableData = ref([])     // 表格展示的数据行
    const total     = ref(0)      // 总记录数（分页器需要）

    // 绑定到搜索表单的 v-model，用户输入时实时改变
    const query = reactive({ ...defaultQuery })

    // 分页参数：当前页码和每页条数
    const pagination = reactive({ page: 1, pageSize: 10 })

    // 「点击查询按钮时」才把 query 的值锁定到 activeQuery
    // 这样改了搜索框但没点查询的情况下切换分页，不会用到未提交的搜索条件
    let activeQuery = { ...defaultQuery }

    // 请求序号：用于"丢弃过期响应"
    // 场景：用户快速切换分页，第1页的响应比第2页慢才回来 → 此时应丢弃第1页的结果
    let requestId = 0

    // ---- 核心方法 ----

    /**
     * 发起列表请求
     * 内部使用 requestId 保证只渲染最后一次发出的请求的结果
     */
    async function getList() {
        const currentId = ++requestId   // 每次调用时递增，记录本次请求的序号
        loading.value = true
        try {
            // 把搜索条件和分页参数合并后传给接口
            const data = await fetchApi({ ...activeQuery, ...pagination })

            // 如果在等待响应期间又发出了新的请求，丢弃这次已过期的结果
            if (currentId !== requestId) return

            tableData.value = data.list
            total.value     = data.total
        } finally {
            // 只有当前请求还是最新请求时，才关闭 loading
            if (currentId === requestId) loading.value = false
        }
    }

    /**
     * 搜索：把当前表单值锁定为查询条件，并重置到第 1 页后发请求
     * 供搜索按钮的 @click 绑定
     */
    function search() {
        activeQuery      = { ...query }  // 锁定搜索条件
        pagination.page  = 1             // 搜索后重置到第一页
        return getList()
    }

    /**
     * 重置：把搜索表单恢复为默认值，并重新搜索
     */
    function reset() {
        Object.assign(query, defaultQuery)
        return search()
    }

    /**
     * 分页器"切换页码"事件处理
     */
    function handlePageChange(page) {
        pagination.page = page
        getList()
    }

    /**
     * 分页器"每页条数"切换事件处理
     */
    function handleSizeChange(size) {
        pagination.pageSize = size
        pagination.page = 1   // 切换每页条数时重置到第一页
        getList()
    }

    /**
     * 删除后刷新列表
     * 特殊处理：如果当前页已经没数据了（比如第 3 页只有 1 条且被删了），
     * 自动退回到上一页，避免出现空列表
     *
     * @param {number} count 本次删除的条数，默认 1
     */
    function refreshAfterDelete(count = 1) {
        if (tableData.value.length <= count && pagination.page > 1) {
            pagination.page--
        }
        return getList()
    }

    // ---- 生命周期 ----

    // 组件挂载完成后，如果 immediate 为 true，自动发起第一次请求
    onMounted(() => {
        if (immediate) search()
    })

    // 把需要对外暴露的状态和方法统一 return 出去
    return {
        loading,
        tableData,
        total,
        query,
        pagination,
        getList,
        search,
        reset,
        handlePageChange,
        handleSizeChange,
        refreshAfterDelete
    }
}