<!--
  src/views/employee/index.vue —— 员工管理页面

  路径：/employee
  作用：管理员工信息（列表、新增、编辑、删除等）。
  目前是占位内容，同时演示了"按钮级权限控制"的用法。

  重点：自定义指令 v-permission
  - 写法：v-permission="['admin']"，表示"只有 admin 角色才能看到这个元素"
  - 原理见 src/directives/permission.js：
    元素挂载后，指令会取出当前用户的角色，如果不在允许列表里，就把该元素从页面上直接移除
  - 这样普通用户登录进来，就根本看不到"删除"按钮
-->
<template>
    <div>
        <h3>员工管理</h3>

        <!-- 普通按钮：所有已登录用户都能看到 -->
        <el-button type="primary">新增</el-button>

        <!--
          受权限控制的按钮：只有 role 为 admin 的用户才会显示
          这里传入的是一个"允许访问的角色数组"
        -->
        <el-button v-permission="['admin']" type="danger">删除（仅管理员可见）</el-button>
    </div>
</template>
