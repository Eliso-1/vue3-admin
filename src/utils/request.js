/**
 * src/utils/request.js —— 基于 Axios 封装的网络请求工具
 *
 * 为什么要封装 Axios？
 * 1. 统一配置：配置基础路径 baseURL、请求超时时间 timeout。
 * 2. 请求拦截器：在每个请求发出去之前，自动把 Token 加到请求头里，免去每次手动写的麻烦。
 * 3. 响应拦截器：统一处理后端返回的数据格式和错误状态（例如 401 token 失效跳转登录页、弹窗报错提示等）。
 */

import axios from 'axios'
import router from '@/router'
import { useUserStore } from '@/stores/user'
// 导入 Element Plus 的消息提示（用于错误提示弹窗）
import { ElMessage } from 'element-plus'
// 手动引入 ElMessage 的样式（初学者必看）
// 为什么必须加这一行？
// 本项目用的是"按需自动引入"，只有写在模板里的组件（如 <el-button>）才会被插件自动注入样式。
// 而 ElMessage 是"函数式 API"，这里是 import { ElMessage } from 'element-plus' 显式引入的，
// 会绕过自动注入样式的插件；此时若不再手动引入它的 CSS，
// 弹窗节点虽然会被创建，但没有任何样式，在页面上是看不见的（看起来就像"没生效"）。
// 所以：只要显式引入了 Element Plus 的函数式 API，就要手动补一行对应的 style/css。
import 'element-plus/es/components/message/style/css'

// 创建一个独立的 Axios 实例
const request = axios.create({
    // baseURL 会自动拼接到具体接口路径前
    // 例如调用 request.post('/login')，最终发出的请求地址是：/api/login
    // 配合 vite.config.js 中的 proxy，就会被转发到 http://localhost:3000/api/login
    baseURL: '/api',
    timeout: 10000 // 10秒超时（超过10秒未响应则自动中断并报错）
})

/**
 * 【请求拦截器】：请求发送前执行
 * 作用：统一在请求头 Header 里携带 Authorization Token
 */
request.interceptors.request.use(
    (config) => {
        // 从 Pinia 的 userStore 中读取已保存的 token
        const userStore = useUserStore()
        if (userStore.token) {
            // 标准规范：Bearer 认证体系
            config.headers.Authorization = `Bearer ${userStore.token}`
        }
        return config // 必须返回处理后的配置对象
    },
    (error) => {
        // 发送请求失败时的处理
        return Promise.reject(error)
    }
)

/**
 * 【响应拦截器】：后端返回结果后、前端拿到数据前执行
 * 作用：统一解包数据、捕获全局错误（如业务失败、401 未授权等）
 */
request.interceptors.response.use(
    // HTTP 状态码为 2xx 时会进入这里
    (response) => {
        // 后端返回的 JSON 主体数据（包含 { code, data, message }）
        const body = response.data

        // 约定：业务 code 为 200 才算真正成功
        if (body.code !== 200) {
            // 弹出错误提示信息（如：“用户名或密码错误”）
            ElMessage.error(body.message || '请求失败')
            // 返回一个拒绝的 Promise，让具体的调用处能进入 catch 块
            return Promise.reject(new Error(body.message || 'Error'))
        }

        // 直接把纯净的业务数据 body.data 返回出去
        // 这样在具体的页面组件里直接拿到数据，不需要每次写 res.data.data
        return body.data
    },
    // HTTP 状态码超出 2xx（如 400, 401, 404, 500 等）或网络断开时进入这里
    (error) => {
        const { response } = error

        // 401 状态码：通常表示未登录、Token 无效或已过期
        if (response?.status === 401) {
            const userStore = useUserStore()
            // 清理本地过期的 token 和用户信息
            userStore.logout()
            ElMessage.error('登录已过期，请重新登录')
            // 重定向到登录页，并把当前页面路径记录在 url query 参数中，方便登录后跳回原页面
            router.push({
                path: '/login',
                query: { redirect: router.currentRoute.value.fullPath }
            })
        } else {
            // 其他网络错误或服务器错误提示
            ElMessage.error(response?.data?.message || error.message || '网络连接异常')
        }

        return Promise.reject(error)
    }
)

export default request