/**
 * router/index.js —— 路由配置文件
 *
 * 路由的作用：定义 URL 路径和页面组件之间的映射关系
 * 比如用户在浏览器地址栏输入 /dashboard，路由就会告诉 Vue 显示"数据看板"页面
 */

// 从 vue-router 中导入两个函数：
// - createRouter：用来创建路由实例
// - createWebHistory：使用 HTML5 的 History 模式（URL 看起来像普通网址，没有 # 号）
import { createRouter, createWebHistory } from 'vue-router'

// 导入布局组件（包含侧边栏 + 顶栏 + 内容区的整体页面框架）
import Layout from '@/layout/index.vue'

/**
 * 路由表 —— 定义所有页面的路径和组件
 *
 * 结构说明：
 * - path: URL 路径
 * - component: 这个路径对应要显示的组件
 * - redirect: 访问该路径时自动跳转到另一个路径
 * - children: 子路由（嵌套在父路由的组件内部显示）
 * - meta: 路由的额外信息（如页面标题、图标名称），可以在组件中通过 route.meta 获取
 * - name: 路由的名称（方便代码中通过名称跳转页面）
 */

// 静态路由
export const constantRoutes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/login/index.vue')
    },
    {
        path: '/',
        name: 'Layout',
        component: Layout,
        redirect: '/dashboard',
        children: [] //子路由登陆后动态添加
    },
    {
        path: '/404',
        name: 'NotFound',
        component: () => import('@/views/error/404.vue')
    }
]

// 动态路由：meta.roles 声明哪些角色可访问
export const asyncRoutes = [
    {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据看板', icon: 'DataLine', roles: ['admin', 'user']}
    },
    {
        path: 'employee',
        name: 'Employee',
        component: () => import('@/views/employee/index.vue'),
        meta: { title: '员工管理', icon: 'User', roles: ['admin', 'user']}
    },
    {
        path: 'department',
        name: 'Department',
        component: () => import('@/views/department/index.vue'),
        meta: { title: '部门管理', icon: 'OfficeBuilding', roles: ['admin']}
    },
    {
        path: 'setting',
        name: 'Setting',
        component: () => import('@/views/settings/index.vue'),
        meta: { title: '系统设置', icon: 'setting', roles: ['admin']}
    }
]

// 创建路由实例
const router = createRouter({
    history: createWebHistory(), // 使用 History 模式（URL 中没有 #）
    routes: constantRoutes       // 传入路由表
})

// 导出路由实例，在 main.js 中通过 app.use(router) 安装
export default router