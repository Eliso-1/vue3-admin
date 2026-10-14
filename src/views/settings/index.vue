<!--
  src/views/settings/index.vue —— 系统设置页面
  
  该页面通过路由中的 { path: 'settings', ... } 动态加载到 Layout 的内容区中。
-->
<template>
    <div class="settings-page">
        <h2>系统设置</h2>
        <p>这里是系统设置的内容区域，后续可在此处扩展系统参数、个性化配置等功能。</p>
    </div>
</template>

<style scoped>
.settings-page {
    padding: 20px;
    background-color: #fff;
    border-radius: 4px;
}
</style>