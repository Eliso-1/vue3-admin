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

## 用户偏好
- 用户是**前端初学者**：写代码/解释时注释要通俗、面向入门，多用类比讲清概念
