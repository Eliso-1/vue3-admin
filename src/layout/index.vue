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
    <div class="layout-shell">

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
/* ===== 整体骨架：左右两栏，高度占满一屏 ===== */
.layout-shell {
    display: flex;
    width: 100%;
    height: 100vh;      /* 100vh = 视口高度，撑满整个浏览器窗口 */
    min-height: 0;
    overflow: hidden;   /* 页面级不滚动，滚动交给内容区 */
    background: #f5f5f3;
}

/* ===== 左侧边栏 ===== */
.layout-aside {
    width: 243px;
    flex: 0 0 243px;        /* 固定宽度，不允许被压缩 */
    overflow: hidden;
    border-right: 1px solid #e9e8e7;
    background: #fff;
    /* 宽度变化时有 0.22s 过渡动画（折叠/展开的顺滑效果就来自这里） */
    transition: width 0.22s ease, flex-basis 0.22s ease;

    /* 折叠态：宽度收到 64px，只露出图标 */
    &.collapsed {
        width: 64px;
        flex-basis: 64px;
    }
}

/* ===== 右侧主区域：顶栏 + 内容区 纵向排列 ===== */
.layout-main {
    display: flex;
    min-width: 0;
    flex: 1;                /* 占据侧边栏以外的全部宽度 */
    flex-direction: column;
}

/* 内容区：具体页面在这里渲染，超出部分自己出滚动条 */
.layout-content {
    min-height: 0;
    flex: 1;
    overflow: auto;
    padding: 30px;
}

/* ===== 响应式：屏幕越窄，留白越小、侧边栏越窄 ===== */

/* 平板：内容区留白缩小 */
@media (max-width: 900px) {
    .layout-aside {
        width: 210px;
        flex-basis: 210px;
    }

    .layout-content {
        padding: 24px 20px;
    }
}

/* 手机：侧边栏直接折叠成 64px（配合 Sidebar 里的 matchMedia 只显示图标） */
@media (max-width: 760px) {
    .layout-aside {
        width: 64px;
        flex-basis: 64px;
    }

    .layout-content {
        padding: 18px 14px;
    }
}
</style>