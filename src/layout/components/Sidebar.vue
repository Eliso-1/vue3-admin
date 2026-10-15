<!--
  Sidebar.vue —— 侧边栏组件

  功能：
  1. 显示系统 Logo
  2. 菜单数据来自 Pinia 的 permissionStore（登录后按角色过滤后的动态路由），不需要手动写每个菜单
  3. 点击菜单项时自动跳转到对应页面
  4. 当前页面的菜单项会高亮显示
  5. 支持折叠/展开
-->
<script setup>
// computed 用来创建"计算属性"——当依赖的数据变化时，它会自动重新计算
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'

// 定义组件接收的 Props（从父组件传过来的数据）
// isCollapse：侧边栏是否折叠，类型为布尔值
defineProps({
    isCollapse: Boolean
})

// 获取当前路由信息（用来判断当前在哪个页面，从而高亮对应菜单）
const route = useRoute()

// 权限 store，里面存着"当前用户能访问的菜单路由"
const permissionStore = usePermissionStore()

// 计算属性：直接读取权限 store 里按角色过滤好的菜单列表
// 好处：不同角色看到的菜单自动不同，且 store 里数据变化时菜单会同步更新
const menus = computed(() => permissionStore.menuRoutes)
// 计算属性：当前高亮的菜单路径（用于 el-menu 的 default-active）
const activePath = computed(() => route.path)
</script>

<template>
    <div class="sidebar">
        <!-- Logo 区域：展开时显示完整名称，折叠时只显示首字母 -->
        <div class="logo">
            <span v-if="!isCollapse">Vue3 Admin</span>
            <span v-else>V</span>
        </div>

        <!--
          el-menu 是 Element Plus 的菜单组件
          - :default-active  当前高亮的菜单项（传入路径，比如 '/dashboard'）
          - :collapse        是否折叠菜单
          - :collapse-transition  折叠时是否有动画（false = 无动画，避免闪烁）
          - background-color 菜单背景色
          - text-color       菜单文字颜色（#ffffffa6 是半透明白色）
          - active-text-color 选中菜单的文字颜色
          - router           开启路由模式：点击菜单项时，自动跳转到 index 指定的路径
        -->
        <el-menu
            :default-active="activePath"
            :collapse="isCollapse"
            :collapse-transition="false"
            background-color="#001529"
            text-color="#ffffffa6"
            active-text-color="#ffffff"
            router
        >
            <!--
              v-for 循环：遍历 menus 数组，为每个路由生成一个菜单项
              - :key   唯一标识，Vue 用它来高效更新 DOM
              - :index 菜单项的路径，点击时会跳转到这个路径（因为开启了 router 模式）
            -->
            <el-menu-item v-for="item in menus" :key="item.path" :index="'/' + item.path">
                <!-- 菜单图标：通过动态组件 <component :is="图标名" /> 来显示 -->
                <!-- 图标名来自路由的 meta.icon，比如 'DataLine'、'User' -->
                <el-icon>
                    <component :is="item.meta.icon" />
                </el-icon>
                <!-- 菜单标题：使用具名插槽 #title，折叠时会自动隐藏 -->
                <template #title>{{ item.meta.title }}</template>
            </el-menu-item>
        </el-menu>
    </div>
</template>

<style lang="scss" scoped>
/* Logo 样式 */
.logo {
    height: 56px;
    line-height: 56px;      /* 行高等于高度，实现文字垂直居中 */
    text-align: center;
    color: #fff;
    font-size: 18px;
    font-weight: bold;
}

/* 去掉 Element Plus 菜单组件默认的右边框线 */
.el-menu {
    border-right: none;
}
</style>