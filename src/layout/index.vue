<!--
  layout/index.vue —— 整体布局组件

  这是一个"骨架"组件，定义了后台管理系统的经典布局：
  ┌──────────┬─────────────────────────┐
  │          │        Header 顶栏       │
  │  Sidebar ├─────────────────────────┤
  │  侧边栏  │                         │
  │          │     RouterView 内容区    │
  │          │    （显示具体的页面）      │
  └──────────┴─────────────────────────┘

  这个组件不显示具体内容，它只负责"排版"，
  具体的页面内容通过 <RouterView /> 根据 URL 自动加载。
-->
<script setup>
// ref 是 Vue 3 的响应式 API，用来创建一个"响应式变量"
// 当这个变量的值改变时，页面会自动更新
import { ref } from 'vue'
// 导入侧边栏和顶栏子组件
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'

// 控制侧边栏是否折叠的变量（true = 折叠，false = 展开）
// 这个变量会传给 Sidebar 和 Header，让它们都能读取和修改
const isCollapse = ref(false)
</script>

<template>
    <!-- 最外层容器，使用 flex 横向排列（侧边栏在左，主区域在右） -->
    <div class="layout">

        <!-- 左侧：侧边栏区域 -->
        <!-- :class 是动态 class，当 isCollapse 为 true 时，添加 collapsed 类名来缩小宽度 -->
        <aside class="layout-aside" :class="{ collapsed: isCollapse }">
            <!--
              :is-collapse 是向子组件传递数据（Props）
              相当于告诉 Sidebar："当前侧边栏是否折叠了"
            -->
            <Sidebar :is-collapse="isCollapse" />
        </aside>

        <!-- 右侧：主区域（顶栏 + 内容） -->
        <div class="layout-main">
            <!--
              v-model:is-collapse 是"双向绑定"
              不仅把 isCollapse 传给 Header，Header 还能修改这个值
              （比如用户点击折叠按钮时，Header 会改变 isCollapse 的值）
            -->
            <Header v-model:is-collapse="isCollapse" />

            <!-- 内容区：通过 RouterView 显示当前路由对应的页面组件 -->
            <main class="layout-content">
                <RouterView />
            </main>
        </div>
    </div>
</template>

<!--
  scoped 表示这些样式只作用于当前组件，不会影响其他组件
  lang="scss" 表示使用 SCSS 语法（支持嵌套写法，比普通 CSS 更方便）
-->
<style lang="scss" scoped>
/* 整体布局：flex 横向排列，高度占满整个视口 */
.layout {
    display: flex;       /* 弹性布局，子元素默认横向排列 */
    height: 100vh;       /* vh = viewport height，100vh 就是浏览器窗口的完整高度 */
}

/* 左侧边栏 */
.layout-aside {
    width: 210px;                /* 展开时宽度 210px */
    flex-shrink: 0;              /* 不允许被压缩（保证侧边栏宽度固定） */
    background-color: #001529;   /* 深蓝色背景 */
    transition: width 0.3s;      /* 宽度变化时有 0.3 秒的过渡动画 */
    overflow: hidden;            /* 超出部分隐藏（折叠时文字不会溢出） */

    /* SCSS 嵌套写法：& 代表父选择器，即 .layout-aside.collapsed */
    &.collapsed {
        width: 64px;             /* 折叠时宽度缩小到 64px（只显示图标） */
    }
}

/* 右侧主区域 */
.layout-main {
    flex: 1;                     /* 占据剩余的所有空间 */
    display: flex;               /* 内部也用 flex 布局 */
    flex-direction: column;      /* 纵向排列（顶栏在上，内容在下） */
    min-width: 0;                /* 防止内容过宽时撑破布局 */
}

/* 内容区 */
.layout-content {
    flex: 1;                     /* 占据主区域的剩余高度 */
    padding: 20px;               /* 内边距 20px */
    overflow: auto;              /* 内容超出时显示滚动条 */
}
</style>