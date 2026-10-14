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
const routes = [
    {
        path: '/',              // 根路径
        component: Layout,      // 使用 Layout 布局组件作为外壳
        redirect: '/dashboard', // 访问 / 时自动跳转到 /dashboard
        children: [
            // 以下是 Layout 内部的子页面，它们会显示在 Layout 的 <RouterView /> 位置
            {
                path: 'dashboard',       // 完整路径：/dashboard
                name: 'Dashboard',
                // 使用"懒加载"方式导入组件：只有用户访问这个页面时才加载，提升首屏速度
                component: () => import('@/views/dashboard/index.vue'),
                meta: { title: '数据看板', icon: 'DataLine' }  // DataLine 是 Element Plus 的图标名
            },
            {
                path: 'employee',        // 完整路径：/employee
                name: 'Employee',
                component: () => import('@/views/employee/index.vue'),
                meta: { title: '员工管理', icon: 'User' }
            },
            {
                path: 'department',      // 完整路径：/department
                name: 'Department',
                component: () => import('@/views/department/index.vue'),
                meta: { title: '部门管理', icon: 'OfficeBuilding' }
            }
        ]
    }
]

// 创建路由实例
const router = createRouter({
    history: createWebHistory(), // 使用 History 模式（URL 中没有 #）
    routes                       // 传入路由表
})

// 导出路由实例，在 main.js 中通过 app.use(router) 安装
export default router