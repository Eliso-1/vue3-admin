/**
 * main.js —— 整个应用的入口文件
 * 这个文件的作用：创建 Vue 应用实例，安装插件，最后挂载到页面上
 */

// 引入全局样式文件（会作用于整个项目的所有页面）
import './assets/main.css'

// 从 Vue 框架中导入 createApp 函数，用来创建一个 Vue 应用
import { createApp } from 'vue'

// 导入 Pinia —— Vue 的状态管理库（类似一个"全局数据仓库"，用来在不同组件间共享数据）
import { createPinia } from 'pinia'

// 导入 Element Plus 的所有图标组件（这样就可以在模板中直接用图标名称来显示图标）
import * as ElementPlusIconVue from '@element-plus/icons-vue'

// 导入根组件 App.vue（整个应用最外层的组件）
import App from './App.vue'

// 导入路由配置（定义了 URL 路径和页面组件的对应关系）
import router from './router'

// 第一步：创建 Vue 应用实例，App 组件是整棵组件树的"根"
const app = createApp(App)

// 第二步：全局注册所有 Element Plus 图标
// Object.entries 把图标对象变成 [名称, 组件] 的数组，然后逐个注册
// 注册后就可以在任意组件中直接通过名称使用图标，例如 <DataLine />
for (const [key, component] of Object.entries(ElementPlusIconVue)) {
    app.component(key, component)
}

// 第三步：安装插件
app.use(createPinia())  // 安装 Pinia 状态管理
app.use(router)          // 安装 Vue Router 路由

// 第四步：将 Vue 应用挂载到 index.html 中 id="app" 的 <div> 元素上
// 挂载后，Vue 就开始接管这个 DOM 元素，页面就"活"了
app.mount('#app')
