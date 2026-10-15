<!--
  src/views/error/404.vue —— 404 错误页（页面不存在 / 无权限）

  什么时候会看到这个页面？两种情况：
  1. 访问了一个不存在的地址（比如 /abcdef）
  2. 地址存在，但当前用户的角色没有访问权限
     —— 动态路由是按角色过滤后添加的，无权访问的地址根本不会被注册，
        于是会被兜底路由 /:pathMatch(.*)* 重定向到这里
        （兜底路由在 src/stores/permission.js 的 generateRoutes 里添加）
-->
<template>
    <div class="not-found">
        <!-- 大号错误码 -->
        <h1>404</h1>
        <p>页面不存在或你没有访问权限</p>

        <!--
          $router.push('/') 是"编程式导航"：用代码跳转到首页
          等价于 <router-link to="/">，只是后者写在模板里、前者写在 JS 里
        -->
        <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
    </div>
</template>

<style scoped>
/* 简单居中排版：上方留白把内容推到视觉中间 */
.not-found {
    padding-top: 120px;
    text-align: center;
}

.not-found p {
    margin: 16px 0;
}
</style>
