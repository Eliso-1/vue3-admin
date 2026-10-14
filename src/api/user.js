/**
 * src/api/user.js —— 用户相关接口管理模块
 *
 * 规范做法：将所有与用户相关的网络请求方法统一写在这里，
 * 好处是各页面按需导入，接口地址若有变更只需修改这一处即可，便于维护。
 */

// 导入封装好的 Axios 请求实例
import request from '@/utils/request'

/**
 * 登录接口
 * @param {Object} data 包含 { username, password }
 * @returns {Promise} 登录成功返回包含 token 的对象，如 { token: '...' }
 */
export const loginApi = (data) => request.post('/login', data)

/**
 * 获取当前登录用户信息
 * 请求时会自动被 request 拦截器携带 Authorization Token
 * @returns {Promise} 返回用户信息对象，如 { username, nickname, role }
 */
export const getUserInfoApi = () => request.get('/userinfo')