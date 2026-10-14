/**
 * mock-server/index.js —— 本地简易模拟后端接口服务
 *
 * 作用：在没有真实后端服务时，自己启动一个基于 Express 的 Node.js 服务，
 * 提供登录、获取用户信息等接口，用来模拟真实的前后端交互。
 *
 * 启动命令：node mock-server/index.js
 */

import express from 'express'

// 创建一个 express 服务实例
const app = express()

// 中间件：让 Express 能够自动解析客户端 POST 请求发送过来的 JSON 格式数据（放入 req.body）
app.use(express.json())

/**
 * 模拟用户数据库
 * 真实项目中数据存放在 MySQL/MongoDB 等数据库中，这里用一个内存对象简单模拟
 */
const users = {
    // 默认测试账号：admin / 123456
    admin: { password: '123456', role: 'admin', nickname: '管理员' },
    // 普通测试账号：user / 123456
    user: { password: '123456', role: 'user', nickname: '普通用户' }
}

/**
 * 封装统一的响应返回格式（规范的前后端交互通常有统一的数据结构）
 * - code: 状态码，200 表示业务处理成功
 * - data: 接口返回的核心数据
 * - message: 说明信息
 */
const ok = (data) => ({ code: 200, data, message: 'success' })
const fail = (code, message) => ({ code, data: null, message })

/**
 * 接口1：登录接口
 * 请求方式：POST
 * 请求地址：/api/login
 * 参数：{ username, password }
 */
app.post('/api/login', (req, res) => {
    const { username, password } = req.body
    const user = users[username]

    // 账号不存在或密码不匹配
    if (!user || user.password !== password) {
        return res.json(fail(400, '用户名或密码错误'))
    }

    // 登录成功：生成一个令牌（Token）返回给前端
    // 在真实商业项目中通常采用 JWT（JSON Web Token），这里简化为字符串 'token-用户名'
    res.json(ok({ token: `token-${username}` }))
})

/**
 * 接口2：获取当前登录用户的信息
 * 请求方式：GET
 * 请求地址：/api/userinfo 或 /api/user/info
 * 鉴权方式：前端需在请求头 Header 中携带 Authorization: Bearer <token>
 */
const handleGetUserInfo = (req, res) => {
    // 从请求头 Authorization 中提取 Token，如 "Bearer token-admin"
    const token = req.headers.authorization?.replace('Bearer ', '')
    // 还原出用户名
    const username = token?.replace('token-', '')
    const user = users[username]

    // 如果没有 Token 或用户不存在，返回 401 提示登录过期
    if (!user) {
        return res.status(401).json(fail(401, '登录已过期，请重新登录'))
    }

    // 返回用户公开信息（绝不要返回密码）
    res.json(ok({ username, role: user.role, nickname: user.nickname }))
}

// 同时支持两种路径写法，避免前端路径不一致导致 404
app.get('/api/userinfo', handleGetUserInfo)
app.get('/api/user/info', handleGetUserInfo)

// 启动服务，监听本地 3000 端口
app.listen(3000, () => {
    console.log('Mock server is running on http://localhost:3000')
})