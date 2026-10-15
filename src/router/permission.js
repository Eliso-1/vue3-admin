/**
 * src/router/permission.js —— 全局路由守卫（整个权限体系的核心）
 *
 * 什么是"路由守卫"？
 * 可以理解为每次页面跳转前都要过的一道"安检"。
 * router.beforeEach() 注册的这个函数，会在每一次路由跳转前自动执行，
 * 由它来决定：是放行、是踢回登录页、还是先去把用户信息拉回来。
 *
 * 本文件在 src/main.js 里通过 import './router/permission' 引入，
 * 只要被 import 一次，守卫就注册完成了（不需要手动调用任何函数）。
 */

import router from '@/router'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'

const whiteList = ['/login']

router.beforeEach(async (to) => {
    const userStore = useUserStore()
    const permissionStore = usePermissionStore()

    // 1. 没 token
    if (!userStore.token) {
        if (whiteList.includes(to.path)) return true
        return { path: '/login', query: { redirect: to.fullPath}}
    }

    // 2. 有 token 还去登陆页，直接回首页
    if (to.path === '/login') return '/'

    // 3. 有 token 但还没用户信息 （首次进入 / 刷新)
    if (!userStore.userInfo) {
        try {
            const info = await userStore.fetchUserInfo()
            permissionStore.generateRoutes(info.role)
            // 动态路由刚添加，需要重新导航一次才能匹配到
            return { ...to, replace: true }
        } catch {
            userStore.logout()
            return { path: '/login', query: { redirect: to.fullPath }}
        }
    }

    return true
})

router.afterEach((to) => {
    document.title = to.meta.title ? `${to.meta.title} - Vue3 Admin` : 'Vue3 Admin'
}) 