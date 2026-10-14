<!--
  App.vue —— 根组件（最外层的组件）

  整个应用只有这一个根组件，它的作用就是放一个 <RouterView />。
  RouterView 是 Vue Router 提供的组件，它会根据当前 URL 自动显示对应的页面组件。

  比如：
  - 访问 /dashboard → RouterView 会显示 Layout 组件（Layout 里又嵌套了 Dashboard 页面）
  - 访问 /employee  → RouterView 会显示 Layout 组件（Layout 里又嵌套了 Employee 页面）
-->
<template>
  <!-- RouterView 是一个"占位符"，根据 URL 动态切换显示的组件 -->
  <RouterView />
</template>