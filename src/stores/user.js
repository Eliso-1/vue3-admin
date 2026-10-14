/**
 * src/stores/user.js —— 用户状态管理模块（基于 Pinia）
 *
 * 作用：保存整个系统共享的用户全局状态（如 Token、用户头像、昵称、角色等）。
 * 并且把登录、获取用户信息、退出登录等核心逻辑封装成 action 函数供各组件调用。
 */

import { ref } from 'vue'
import { defineStore } from 'pinia'
import { loginApi, getUserInfoApi } from '@/api/user'

/**
 * defineStore 使用组合式 API（Setup Store 风格）写法：
 * 类似一个 setup() 函数：
 * - ref() 就是状态 state
 * - 普通函数/异步函数 就是动作 actions
 */
export const useUserStore = defineStore('user', () => {
    // 1. 状态：用户令牌 token
    // 初始化时优先从浏览器的 localStorage 读取，这样刷新页面后登录状态不丢失
    const token = ref(localStorage.getItem('token') || '')

    // 2. 状态：用户信息对象（包含 username, nickname, role 等）
    const userInfo = ref(null)

    /**
     * 动作：执行登录
     * @param {Object} form 表单数据 { username, password }
     */
    async function login(form) {
        // 调用接口获取数据
        const data = await loginApi(form)
        // 更新 Pinia 中的响应式变量
        token.value = data.token
        // 将 token 持久化存储到浏览器的 localStorage 中（持久化保存）
        localStorage.setItem('token', data.token)
    }

    /**
     * 动作：获取当前登录用户的详细信息
     */
    async function fetchUserInfo() {
        userInfo.value = await getUserInfoApi()
        return userInfo.value
    }

    /**
     * 动作：退出登录
     * 清理所有用户登录态及本地存储
     */
    function logout() {
        token.value = ''
        userInfo.value = null
        localStorage.removeItem('token')
    }

    // 将需要供外部组件使用的状态和方法暴露出去
    return { token, userInfo, login, fetchUserInfo, logout }
})