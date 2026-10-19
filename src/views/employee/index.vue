<!--
  src/views/employee/index.vue —— 员工管理页面

  功能：
  1. 搜索栏：按姓名、部门、状态过滤员工
  2. 新增 / 编辑员工（通过弹窗 EmployeeDialog 完成）
  3. 删除员工（仅 admin 角色可见删除按钮）
  4. 分页展示员工列表
-->
<script setup>
import { ref, onMounted } from 'vue'
// 导入封装好的通用表格逻辑（分页、搜索、加载状态等）
import { useTable } from '@/composables/useTable'
// 导入员工相关接口
import { getEmployeeListApi, deleteEmployeeApi } from '@/api/employee'
// 导入部门接口（用于搜索栏的部门下拉选项）
import { getDepartmentListApi } from '@/api/department'
// 导入员工新增/编辑弹窗组件
import EmployeeDialog from './components/EmployeeDialog.vue'

/**
 * 使用 useTable 组合式函数，把表格相关的所有状态和方法一次性解构出来
 * - loading:           是否正在加载（控制表格遮罩）
 * - tableData:         当前页的员工数据
 * - total:             总记录数（供分页器使用）
 * - query:             搜索表单的绑定对象
 * - pagination:        当前页码和每页条数
 * - search():          点击查询按钮时调用，重置到第 1 页并发请求
 * - reset():           点击重置时调用，清空搜索条件后重新查询
 * - handlePageChange:  分页器翻页时调用
 * - handleSizeChange:  分页器切换每页条数时调用
 * - refreshAfterDelete:删除后刷新列表（自动处理最后一页删空的情况）
 */
const {
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
} = useTable(getEmployeeListApi, {
    // defaultQuery 定义了搜索表单的初始值（同时也是重置时恢复的值）
    defaultQuery: { name: '', departmentId: '', status: '' }
})

// 部门列表：用于搜索栏和弹窗中的部门下拉选项
const departments = ref([])
onMounted(async () => {
    // 组件挂载时拉取部门列表（只需请求一次，不会变动）
    departments.value = await getDepartmentListApi()
})

// ---- 弹窗控制 ----

// 弹窗是否显示
const dialogVisible = ref(false)
// 当前操作的员工行数据：null = 新增模式；有值 = 编辑模式
const currentRow = ref(null)

// 点击"新增员工"按钮
function handleAdd() {
    currentRow.value    = null   // 清空当前行，弹窗判断为新增模式
    dialogVisible.value = true
}

// 点击表格行的"编辑"按钮
function handleEdit(row) {
    currentRow.value    = row    // 传入当前行数据，弹窗判断为编辑模式
    dialogVisible.value = true
}

/**
 * 弹窗提交成功后的回调
 * - 新增：调用 search()，回到第 1 页（新数据排在最前面，第 1 页能看到）
 * - 编辑：调用 getList()，留在当前页刷新（不重置页码）
 */
function handleSuccess() {
    currentRow.value ? getList() : search()
}

/**
 * 删除员工
 * 流程：弹出确认框 → 用户点确定 → 调用删除接口 → 刷新列表
 */
async function handleDelete(row) {
    try {
        // 弹出确认对话框，防止误操作
        await ElMessageBox.confirm(`确定删除员工「${row.name}」吗？`, '提示', { type: 'warning' })
    } catch {
        return // 用户点了"取消"，直接退出函数
    }
    await deleteEmployeeApi(row.id)
    ElMessage.success('删除成功')
    // 删除后刷新：如果当前页被删空了，自动退回上一页
    refreshAfterDelete()
}
</script>

<template>
    <div>
        <!-- 搜索区域 -->
        <el-card shadow="never" class="search-card">
            <!--
              :model="query" 绑定搜索表单数据
              @submit.prevent  阻止 form 默认的 HTML 提交行为（防止刷新页面）
            -->
            <el-form :model="query" inline @submit.prevent>
                <el-form-item label="姓名">
                    <!-- clearable：显示清空按钮；@keyup.enter 支持回车直接搜索 -->
                    <el-input v-model="query.name" placeholder="请输入姓名" clearable @keyup.enter="search" />
                </el-form-item>

                <el-form-item label="部门">
                    <!-- 部门下拉列表，数据来自 departments -->
                    <el-select v-model="query.departmentId" placeholder="全部" clearable style="width: 160px">
                        <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
                    </el-select>
                </el-form-item>

                <el-form-item label="状态">
                    <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
                        <el-option label="在职" :value="1" />
                        <el-option label="离职" :value="0" />
                    </el-select>
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" @click="search">查询</el-button>
                    <el-button @click="reset">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 表格区域 -->
        <el-card shadow="never">
            <!-- 工具栏：放表格上方的操作按钮 -->
            <div class="toolbar">
                <el-button type="primary" icon="Plus" @click="handleAdd">新增员工</el-button>
            </div>

            <!--
              v-loading：当 loading 为 true 时，在表格上显示加载遮罩
              border：显示表格边框；stripe：隔行变色
            -->
            <el-table v-loading="loading" :data="tableData" border stripe>
                <!--
                  序号列：根据当前页码动态计算真实序号
                  例如第 2 页第 3 行 = (2-1)*10 + 3 = 13
                  :index 接收一个函数，i 是该行在当前页的下标（从 0 开始）
                -->
                <el-table-column
                    type="index"
                    label="序号"
                    width="70"
                    :index="(i) => (pagination.page - 1) * pagination.pageSize + i + 1"
                />
                <el-table-column prop="name"           label="姓名" />
                <el-table-column prop="gender"         label="性别"    width="80" />
                <el-table-column prop="phone"          label="手机号"  min-width="130" />
                <el-table-column prop="departmentName" label="部门" />
                <el-table-column prop="hireDate"       label="入职日期" min-width="120" />

                <!-- 状态列：用标签颜色区分在职/离职 -->
                <el-table-column label="状态" width="90">
                    <template #default="{ row }">
                        <!-- row.status === 1 → 在职（绿色 success），否则离职（灰色 info） -->
                        <el-tag :type="row.status === 1 ? 'success' : 'info'">
                            {{ row.status === 1 ? '在职' : '离职' }}
                        </el-tag>
                    </template>
                </el-table-column>

                <!-- 操作列 -->
                <el-table-column label="操作" width="140" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
                        <!--
                          v-permission="['admin']" 是自定义权限指令
                          作用：只有当前用户角色在数组中时，才会渲染这个元素
                          普通用户看不到删除按钮，admin 才能看到
                        -->
                        <el-button v-permission="['admin']" link type="danger" @click="handleDelete(row)">
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页器 -->
            <div class="pagination">
                <el-pagination
                    v-model:current-page="pagination.page"
                    v-model:page-size="pagination.pageSize"
                    :total="total"
                    :page-sizes="[10, 20, 50]"
                    layout="total, sizes, prev, pager, next, jumper"
                    background
                    @current-change="handlePageChange"
                    @size-change="handleSizeChange"
                />
            </div>
        </el-card>

        <!--
          员工新增/编辑弹窗
          - v-model：控制弹窗显示/隐藏
          - :row：传入的员工数据（null=新增，有值=编辑）
          - :departments：部门列表（供弹窗内的部门下拉选用）
          - @success：提交成功后刷新列表
        -->
        <EmployeeDialog
            v-model="dialogVisible"
            :row="currentRow"
            :departments="departments"
            @success="handleSuccess"
        />
    </div>
</template>

<style lang="scss" scoped>
/* 搜索卡片与表格卡片之间的间距 */
.search-card {
    margin-bottom: 16px;
}

/* 新增按钮与表格之间的间距 */
.toolbar {
    margin-bottom: 16px;
}

/* 分页器：右对齐，并与表格留出间距 */
.pagination {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
}
</style>