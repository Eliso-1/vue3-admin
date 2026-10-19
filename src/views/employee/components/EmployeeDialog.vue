<!--
  src/views/employee/components/EmployeeDialog.vue —— 员工新增/编辑弹窗

  这是一个"通用表单弹窗"，通过外部传入的 row 参数来区分两种模式：
  - row 为 null/undefined → 新增模式（表单清空，提交时调用 createEmployeeApi）
  - row 有值             → 编辑模式（表单回填数据，提交时调用 updateEmployeeApi）

  父组件使用方式：
    <EmployeeDialog
      v-model="dialogVisible"
      :row="currentRow"
      :departments="departments"
      @success="handleSuccess"
    />
-->
<script setup>
// nextTick：等待 Vue 完成 DOM 更新后执行回调
// 用于弹窗打开后才能访问到 el-form 实例，然后调用 clearValidate()
import { reactive, ref, nextTick } from 'vue'
import { createEmployeeApi, updateEmployeeApi } from '@/api/employee'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'

// 接收父组件传入的 Props
const props = defineProps({
    row:         Object,                      // 编辑时传入行数据，新增时为 null
    departments: { type: Array, default: () => [] }  // 部门下拉列表数据
})

// 定义触发给父组件的自定义事件
// success：表单提交成功后通知父组件刷新列表
const emit = defineEmits(['success'])

// defineModel()：把弹窗是否显示的状态与父组件双向绑定（对应父组件的 v-model）
const visible    = defineModel({ type: Boolean })

// 表单的 DOM 引用，用于调用 validate() 和 clearValidate()
const formRef    = ref()
// 控制提交按钮的 loading 状态，防止重复提交
const submitting = ref(false)

/**
 * 表单默认值工厂函数（每次调用返回一个全新的对象，避免对象引用共享导致的数据污染）
 * 为什么用函数而不是直接写对象？
 * 因为 reactive() 的初始值如果复用同一个对象引用，多次打开弹窗会相互干扰
 */
const defaultForm = () => ({
    id:           undefined,  // 编辑时需要，新增时为空
    name:         '',
    gender:       '男',
    phone:        '',
    departmentId: undefined,
    hireDate:     '',
    status:       1           // 默认在职
})

// 响应式表单数据对象
const form = reactive(defaultForm())

// 表单验证规则
const rules = {
    name:         [{ required: true,  message: '请输入姓名',   trigger: 'blur' }],
    phone:        [
        { required: true,  message: '请输入手机号',           trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
    ],
    departmentId: [{ required: true,  message: '请选择部门',   trigger: 'change' }],
    hireDate:     [{ required: true,  message: '请选择入职日期', trigger: 'change' }]
}

/**
 * 弹窗打开时的初始化逻辑（绑定在 el-dialog 的 @open 事件上）
 * - 新增：把表单重置为空的默认值
 * - 编辑：把 row 里的数据回填到表单中
 *
 * nextTick 的作用：等 DOM 渲染完成后再调用 clearValidate()
 * 若不用 nextTick，el-form 实例可能还没挂载，调用会报错
 */
function handleOpen() {
    const base = defaultForm()
    if (props.row) {
        // 遍历默认字段，只从 row 中取同名字段，避免把多余字段（如 departmentName）混入
        for (const key of Object.keys(base)) base[key] = props.row[key]
    }
    Object.assign(form, base)
    // 清除上次可能残留的校验错误提示
    nextTick(() => formRef.value?.clearValidate())
}

/**
 * 提交表单
 * 流程：前端校验 → 调用对应接口 → 成功后关闭弹窗并通知父组件
 */
async function handleSubmit() {
    // 触发 Element Plus 表单校验，若有未填必填项则抛出异常，阻断后续代码
    await formRef.value.validate()

    submitting.value = true
    try {
        if (props.row) {
            // 编辑模式：调用修改接口（PUT /employees/:id）
            await updateEmployeeApi(form.id, form)
            ElMessage.success('修改成功')
        } else {
            // 新增模式：调用新增接口（POST /employees）
            await createEmployeeApi(form)
            ElMessage.success('新增成功')
        }
        // 关闭弹窗（修改 defineModel 的值为 false，父组件的 v-model 也会同步）
        visible.value = false
        // 通知父组件刷新列表
        emit('success')
    } finally {
        // 无论成功还是失败都关闭 loading，防止按钮永久转圈
        submitting.value = false
    }
}
</script>

<template>
    <!--
      el-dialog 弹窗组件
      - v-model：控制显示/隐藏
      - :title：根据是否有 row 动态显示"编辑员工"或"新增员工"
      - destroy-on-close：弹窗关闭时销毁内部 DOM（防止表单数据残留）
      - @open：弹窗每次打开时调用 handleOpen 初始化表单
    -->
    <el-dialog
        v-model="visible"
        :title="props.row ? '编辑员工' : '新增员工'"
        width="480px"
        destroy-on-close
        @open="handleOpen"
    >
        <!--
          :rules 绑定校验规则（注意：是 :rules 而不是 :rule）
          label-width：统一设置左侧标签的宽度，让表单对齐
        -->
        <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
            <el-form-item label="姓名" prop="name">
                <el-input v-model="form.name" placeholder="请输入姓名" />
            </el-form-item>

            <el-form-item label="性别">
                <!-- 性别不做必填校验，有默认值"男" -->
                <el-radio-group v-model="form.gender">
                    <el-radio value="男">男</el-radio>
                    <el-radio value="女">女</el-radio>
                </el-radio-group>
            </el-form-item>

            <el-form-item label="手机号" prop="phone">
                <!-- maxlength 限制最多输入 11 位 -->
                <el-input v-model="form.phone" maxlength="11" placeholder="请输入手机号" />
            </el-form-item>

            <el-form-item label="部门" prop="departmentId">
                <el-select v-model="form.departmentId" placeholder="请选择部门" style="width: 100%">
                    <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
                </el-select>
            </el-form-item>

            <el-form-item label="入职日期" prop="hireDate">
                <el-date-picker
                    v-model="form.hireDate"
                    type="date"
                    value-format="YYYY-MM-DD"
                    placeholder="选择日期"
                    style="width: 100%"
                />
            </el-form-item>

            <el-form-item label="状态">
                <el-radio-group v-model="form.status">
                    <el-radio :value="1">在职</el-radio>
                    <el-radio :value="0">离职</el-radio>
                </el-radio-group>
            </el-form-item>
        </el-form>

        <!-- 弹窗底部按钮区（使用具名插槽 #footer） -->
        <template #footer>
            <el-button @click="visible = false">取消</el-button>
            <!-- :loading 为 true 时按钮显示旋转图标，防止重复点击 -->
            <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
        </template>
    </el-dialog>
</template>