# 项目长期记忆 —— vue3-admin

## 技术栈
- Vue 3 (`<script setup>` 语法) + Vite 8 + Vue Router 5 + Pinia
- UI：Element Plus（通过 unplugin-auto-import / unplugin-vue-components **自动引入**，用组件和 API 时无需手动 import）
- 其他：echarts（图表）、axios（请求）、sass/scss
- 路径别名：`@` → `src`

## 目录结构约定
- `src/main.js` 入口；`src/App.vue` 根组件（只放 `<RouterView />`）
- `src/router/index.js` 路由表（含懒加载、meta.title/icon）
- `src/layout/` 布局骨架（index.vue + components/Header.vue、Sidebar.vue）
- `src/views/<模块>/index.vue` 各业务页面；菜单由路由 meta 自动生成

## 现状
- 三个视图（dashboard / employee / department）目前均为占位内容，待开发
- `src/assets/base.css` 为 Vite 模板遗留文件，未被引用

## 重要坑：Element Plus 函数式 API 必须手动引入样式
项目用 Element Plus **按需自动引入**（`unplugin-vue-components` + `unplugin-auto-import` + `ElementPlusResolver`）。
- 模板组件（`<el-button>` 等）：插件自动注入组件 + CSS，**不用管样式**。
- 函数式 API（`ElMessage` / `ElMessageBox` / `ElNotification` / `ElLoading`）：若代码里写了
  `import { ElMessage } from 'element-plus'`，会**绕过自动注入样式**，必须再手动补一行 CSS，
  否则弹窗 DOM 被创建但无样式 → 页面看不见（表现为"不生效"）。
- 路径规则：`element-plus/es/components/<组件名>/style/css`
  （如 message → `element-plus/es/components/message/style/css`；
    message-box → `.../message-box/style/css`，其自带 overlay 遮罩样式，无需额外引入）。

## 用户偏好
- 用户是**前端初学者**：写代码/解释时注释要通俗、面向入门，多用类比讲清概念
