<!--
  Header.vue —— 顶栏组件

  功能：
  1. 左侧：折叠/展开按钮 + 面包屑导航（显示当前页面位置）
  2. 右侧：用户头像和下拉菜单
-->
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

// 导入 Element Plus 的两个图标（折叠和展开按钮用）
import { Fold, Expand } from '@element-plus/icons-vue'

/**
 * defineModel 是 Vue 3.4+ 的新特性，用于实现"双向绑定"
 *
 * 父组件用法：<Header v-model:is-collapse="isCollapse" />
 * 效果：
 *   - 父组件的 isCollapse 值会传递进来
 *   - 当这里修改 isCollapse 时，父组件的值也会同步更新
 *
 * 这比传统的 props + emit 写法更简洁
 */
const isCollapse = defineModel('isCollapse', { type: Boolean })

// 获取当前路由信息
const route = useRoute()

// 计算属性：获取当前页面的标题（来自路由的 meta.title）
// 比如在 /dashboard 页面时，currentTitle 的值就是 '数据看板'
const currentTitle = computed(() => route.meta.title)
</script>

<template>
    <header class="header">
        <!-- 左侧区域：折叠按钮 + 面包屑 -->
        <div class="left">
            <!--
              折叠/展开按钮
              @click 点击事件：取反 isCollapse 的值（展开→折叠，折叠→展开）
              v-if/v-else：根据状态显示不同的图标
                - 折叠状态 → 显示 Expand（展开图标）
                - 展开状态 → 显示 Fold（折叠图标）
            -->
            <el-icon class="collapse-btn" :size="20" @click="isCollapse = !isCollapse">
               <Expand v-if="isCollapse" />
               <Fold v-else />
            </el-icon>

            <!--
              面包屑导航：显示当前页面在网站中的位置
              比如：首页 / 数据看板
              separator="/" 表示层级之间用 / 分隔
            -->
            <el-breadcrumb separator="/">
                <el-breadcrumb-item>首页</el-breadcrumb-item>
                <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
            </el-breadcrumb>
        </div>

        <!-- 右侧区域：用户信息 -->
        <div>
            <!--
              el-dropdown 是 Element Plus 的下拉菜单组件
              点击用户头像/名称时会弹出菜单
            -->
            <el-dropdown>
                <!-- 触发下拉菜单的元素：头像 + 用户名 -->
                <span class="user">
                    <!-- el-avatar 是头像组件，size=28 表示 28px 大小 -->
                    <el-avatar size="28">A</el-avatar>
                    <span class="name">管理员</span>
                </span>

                <!-- #dropdown 是下拉菜单的内容（使用具名插槽） -->
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item>退出登录</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
    </header>
</template>

<style lang="scss" scoped>
/* 顶栏整体样式 */
.header {
    display: flex;                  /* 弹性布局 */
    justify-content: space-between; /* 左右两端对齐（左侧靠左，右侧靠右） */
    align-items: center;            /* 垂直居中 */
    height: 56px;
    padding: 0 20px;
    background-color: #fff;
    box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%); /* 底部阴影，增加层次感 */
}

/* 左侧区域：按钮和面包屑横向排列 */
.left {
    display: flex;
    align-items: center;
    gap: 16px;          /* 子元素之间的间距 16px */
}

/* 折叠按钮：鼠标悬停时显示手型光标 */
.collapse-btn {
    cursor: pointer;
}

/* 用户信息区域 */
.user {
    display: flex;
    align-items: center;
    gap: 8px;           /* 头像和用户名之间的间距 */
    cursor: pointer;
    outline: none;      /* 去掉点击时的蓝色边框 */
}
</style>