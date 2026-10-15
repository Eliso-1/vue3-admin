/**
 * src/stores/permission.js —— 权限状态管理（基于 Pinia）
 *
 * 作用：根据当前登录用户的角色，从"动态路由表 asyncRoutes"里筛选出该用户能访问的路由，
 * 再通过 router.addRoute() 把它们真正注册到路由实例上；同时把菜单数据存起来给侧边栏用。
 *
 * 为什么要"动态添加"路由，而不是一开始就全注册？
 * 如果所有路由一开始就注册好，那普通用户虽然在菜单里点不到"部门管理"，
 * 却还是能在地址栏直接输入 /department 进去。
 * 动态添加能从根上解决：无权访问的路由压根不存在，访问它只会走兜底路由跳到 404。
 */

import { ref } from 'vue'
import { defineStore } from 'pinia'
import router, { asyncRoutes } from '@/router'

export const usePermissionStore = defineStore('permission', () => {
    const menuRoutes = ref([]) // 用于生成侧边菜单
    let removers = [] // addRoute 的返回值，调用即可移除该路由

    function generateRoutes(role) {
        const accessible = asyncRoutes.filter((r) => !r.meta?.roles || r.meta.roles.includes(role))

        accessible.forEach((r) => removers.push(router.addRoute('Layout', r)))

        // 404 兜底必须最后添加，否则刷新动态路由页面时会被它先匹配
        removers.push(router.addRoute({ path: '/:pathMatch(.*)*', redirect: '/404'}))

        menuRoutes.value = accessible
    }

    function resetRoutes() {
        removers.forEach((remove) => remove())
        removers = []
        menuRoutes.value = []
    }

    return { menuRoutes, generateRoutes, resetRoutes }
})