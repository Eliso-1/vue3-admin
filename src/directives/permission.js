/**
 * src/directives/permission.js —— 自定义指令：v-permission（按钮级权限控制）
 *
 * 什么是指令？
 * 指令就是写在标签上的特殊标记，用来"直接操作 DOM 元素"。
 * Vue 自带的指令你肯定见过：v-if、v-for、v-model。
 * 这里我们造一个自己的：v-permission，用来控制"谁能看到这个按钮"。
 *
 * 使用方式（在任意组件的模板里）：
 *   <el-button v-permission="['admin']">删除</el-button>
 *   含义：只有角色是 admin 的用户，这个按钮才会显示
 *
 * 注册位置：src/main.js 里的 app.directive('permission', permission)
 * 注册之后，全项目所有组件都可以直接用 v-permission
 */

import { useUserStore } from "@/stores/user"

export const permission = {
    /**
     * mounted 是指令的生命周期钩子：元素被插入到页面（挂载完成）的那一刻执行
     * @param {HTMLElement} el 当前绑定了这个指令的 DOM 元素（也就是那个按钮）
     * @param {Object} binding 指令的绑定信息对象
     *                 binding.value 就是传进来的值，比如 ['admin']
     */
    mounted(el, binding) {
        // 允许访问的角色列表，例如 ['admin']
        const roles = binding.value
        // 当前登录用户的角色。可选链 ?. 保证"还没登录、userInfo 为空"时不会报错
        const role = useUserStore().userInfo?.role

        // 如果传入的是数组，且当前用户角色不在允许列表里 → 把这个元素从页面上移除
        // 注意是"移除 DOM"，不只是隐藏，所以用户改 CSS 也显示不出来
        if (Array.isArray(roles) && !roles.includes(role)) {
            el.parentNode?.removeChild(el)
        }
    }
}
