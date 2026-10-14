/**
 * vite.config.js —— Vite 构建工具的配置文件
 *
 * Vite 负责：
 *   - 启动本地开发服务器（npm run dev）
 *   - 打包构建生产代码（npm run build）
 *   - 处理 .vue 文件、SCSS、路径别名等
 *
 * 这个文件就是告诉 Vite："请按以下规则来工作"。
 */

// node:url 提供 fileURLToPath 和 URL 两个工具，用来把文件路径转成可用的绝对路径
import { fileURLToPath, URL } from 'node:url'

// defineConfig 只是给配置对象加"类型提示"，让我们写配置时能获得自动补全
import { defineConfig } from 'vite'
// @vitejs/plugin-vue：让 Vite 能识别并编译 .vue 单文件组件
import vue from '@vitejs/plugin-vue'
// Vue 开发者调试工具插件（浏览器里会多出一个调试面板）
import vueDevTools from 'vite-plugin-vue-devtools'
// 自动导入插件：使用 Element Plus 的 API 时无需手动 import
import AutoImport from 'unplugin-auto-import/vite'
// 组件自动注册插件：使用 Element Plus 组件时无需手动 import 和注册
import Components from 'unplugin-vue-components/vite'
// Element Plus 的解析器：告诉上面两个插件"应从哪里自动导入 Element Plus 的内容"
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  // plugins：需要用到的 Vite 插件列表
  plugins: [
    vue(), // 支持 .vue 文件
    // 自动导入 Element Plus 的"函数式 API"，
    // 例如：ElMessage、ElMessageBox 等，用的时候不用 import
    AutoImport({ resolvers: [ElementPlusResolver()] }),
    // 自动注册 Element Plus 的"组件"，
    // 例如：<el-button>、<el-menu> 等，用的时候不用 import 和注册
    Components({ resolvers: [ElementPlusResolver()] }),
  ],
  // resolve：模块解析相关配置
  resolve: {
    // alias：路径别名。配置后可用 '@/xxx' 代替 'src/xxx'，写起来更简洁
    alias: {
      // '@' 指向项目根目录下的 src 文件夹
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
