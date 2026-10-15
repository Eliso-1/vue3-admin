<!--
  src/views/login/index.vue —— 登录页面组件

  功能：
  1. 用户名、密码表单输入与格式校验（用户名必填、密码必填且不少于6位）
  2. 支持回车键快速提交登录
  3. 点击登录按钮展示 loading 动画，防止用户重复点击
  4. 登录成功后拉取用户信息，并跳转到目标页面或首页
-->
<script setup>
// reactive: 创建响应式对象（适合表单这类包含多个属性的复杂数据）
// ref: 创建基础类型的响应式引用
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
// 引入 ElMessage 对应的样式文件，否则弹窗没有样式、在页面上看不见
// （原因：这里显式 import 了 ElMessage，会绕过自动注入样式的插件，必须手动补 CSS）
import 'element-plus/es/components/message/style/css'

const route = useRoute()     // 获取当前路由信息（用于读取 URL 中的 redirect 重定向参数）
const router = useRouter()   // 路由跳转实例
const userStore = useUserStore() // 用户状态仓库

// 绑定 el-form 的模板引用，用于调用表单验证方法 validate()
const formRef = ref()
// 按钮加载中状态（true 表示正在请求登录接口中）
const loading = ref(false)

// 响应式表单数据对象（预填默认测试账号）
const form = reactive({
    username: 'admin',
    password: '123456'
})

// 表单验证规则（Element Plus 的表单验证配置）
const rules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
    ]
}

/**
 * 处理登录提交事件
 */
async function handleLogin() {
    // 1. 触发 Element Plus 表单的前端校验，若有未填项则抛出异常中断执行
    await formRef.value.validate()

    // 2. 开启按钮 loading 加载动画
    loading.value = true
    try {
        // 3. 调用 userStore 的 login 动作（发送登录请求并保存 token）
        await userStore.login(form)
        
        ElMessage.success('登录成功')

        // 6. 路由跳转：如果之前访问受保护页面被拦截，会记录在 redirect 参数中，登录后优先跳回原页面
        router.push(route.query.redirect || '/')
    } catch(e) {
        console.warn('登陆失败:', e.message)
    } finally {
        // 无论成功还是失败，最后都关闭 loading
        loading.value = false
    }
}
</script>

<template>
    <div class="login-page">
        <!-- 登录卡片居中展示 -->
        <el-card class="login-card">
            <h2 class="title">Vue3 Admin</h2>

            <!--
              el-form 表单容器：
              - :model="form" 绑定表单数据对象
              - :rules="rules" 绑定表单验证规则
              - @keyup.enter="handleLogin" 监听回车键，按回车直接触发登录
            -->
            <el-form ref="formRef" :model="form" :rules="rules" @keyup.enter="handleLogin">
                <!-- 用户名输入项，prop 对应 rules 中的规则名 -->
                <el-form-item prop="username">
                    <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" />
                </el-form-item>

                <!-- 密码输入项 -->
                <el-form-item prop="password">
                    <el-input
                        v-model="form.password"
                        type="password"
                        placeholder="密码"
                        prefix-icon="Lock"
                        show-password
                    />
                </el-form-item>

                <!-- 登录提交按钮 -->
                <el-button
                    type="primary"
                    :loading="loading"
                    @click="handleLogin"
                    class="login-btn"
                >
                    登录
                </el-button>
            </el-form>

            <p class="tip">测试账号：admin / 123456, user / 123456</p>
        </el-card>
    </div>
</template>

<style lang="scss" scoped>
/* 整个登录页面背景：满屏高度、渐变蓝背景、Flex 居中对齐 */
.login-page {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #1d3557, #457b9d);
}

/* 登录卡片样式 */
.login-card {
    width: 380px;
    padding: 10px 10px 0;
}

/* 标题样式 */
.title {
    text-align: center;
    margin-bottom: 24px;
}

/* 登录按钮撑满整行 */
.login-btn {
    width: 100%;
}

/* 底部提示文字 */
.tip {
    margin-top: 16px;
    font-size: 12px;
    color: #999;
    text-align: center;
}
</style>