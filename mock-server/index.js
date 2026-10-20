/**
 * mock-server/index.js —— 本地简易模拟后端接口服务
 *
 * 作用：在没有真实后端时，自己启动一个基于 Express 的 Node.js 服务，
 * 提供登录、用户信息、部门、员工等接口，用来模拟真实的前后端交互。
 *
 * 启动命令：node mock-server/index.js
 */

import express from 'express'

// 创建一个 Express 应用实例
const app = express()

// 中间件：让 Express 能自动解析请求体中的 JSON 数据，存入 req.body
app.use(express.json())

// ---------- 模拟数据库 ----------

/**
 * 模拟用户表
 * 真实项目中数据存放在 MySQL / MongoDB 等数据库里，这里用内存对象简单模拟
 */
const users = {
    // 测试账号：admin / 123456（管理员，拥有全部权限）
    admin: { password: '123456', role: 'admin', nickname: '管理员' },
    // 测试账号：user / 123456（普通用户，部分接口受限）
    user:  { password: '123456', role: 'user',  nickname: '普通用户' }
}

/**
 * 模拟部门表
 */
const departments = [
    { id: 1, name: '研发部' },
    { id: 2, name: '产品部' },
    { id: 3, name: '设计部' },
    { id: 4, name: '市场部' },
    { id: 5, name: '人事部' }
]

/**
 * 模拟员工表（53 条随机数据）
 * Array.from({ length: 53 }, (_, i) => ...) 等同于循环 53 次生成数组
 */
const surnames   = '赵钱孙李周吴郑王冯陈'.split('')
const givenNames = ['伟', '芳', '娜', '敏', '静', '磊', '洋', '勇', '艳', '杰', '涛', '明', '超', '强']

let nextId = 1
const employees = Array.from({ length: 53 }, (_, i) => ({
    id:           nextId++,
    name:         surnames[i % surnames.length] + givenNames[(i * 7) % givenNames.length],
    gender:       i % 3 === 0 ? '女' : '男',
    phone:        `138${String(10000000 + i * 7919).padStart(8, '0')}`,
    departmentId: (i % 5) + 1,
    hireDate:     `2022-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    status:       i % 5 === 0 ? 0 : 1   // 1=在职，0=离职
}))

// ---------- 工具函数 ----------

/**
 * 统一响应格式封装
 * - ok(data)          => { code: 200, data, message: 'success' }
 * - fail(code, msg)   => { code, data: null, message }
 *
 * 前后端约定好统一格式后，响应拦截器就可以统一处理了
 */
const ok   = (data)           => ({ code: 200, data, message: 'success' })
const fail = (code, message)  => ({ code, data: null, message })

/**
 * 从请求体中提取表单字段（白名单过滤）
 * 作用：防止前端多传字段（如 id）直接写入数据库，只取我们关心的字段
 */
const pickFields = ({ name, gender, phone, departmentId, hireDate, status }) => ({
    name, gender, phone,
    departmentId: Number(departmentId),   // 确保是数字类型
    hireDate,
    status: Number(status)
})

// ---------- 通用中间件 ----------

/**
 * 模拟网络延迟 300ms
 * 好处：可以观察页面上的 loading 动画效果，更贴近真实网络环境
 * next() 是 Express 中间件链中"交给下一个处理器"的意思
 */
app.use((req, res, next) => setTimeout(next, 300))

/**
 * 鉴权中间件：验证请求头中的 Token，通过后把用户信息挂到 req.user
 *
 * 使用方式：在路由第二个参数中传入 auth，就会先经过这里验证
 * 例如：app.get('/api/departments', auth, handler)
 *
 * Token 格式：前端发送的 Authorization 头格式为 "Bearer token-admin"
 *   - 去掉 "Bearer " 前缀 → "token-admin"
 *   - 去掉 "token-" 前缀  → "admin"（用户名）
 */
function auth(req, res, next) {
    const token    = req.headers.authorization?.replace('Bearer ', '')
    const username = token?.replace('token-', '')
    const user     = users[username]

    // Token 无效或用户不存在 → 401 未登录
    if (!user) return res.status(401).json(fail(401, '登录已过期，请重新登录'))

    // 把用户信息挂载到 req.user，后续的路由处理函数可以通过 req.user 获取
    req.user = { username, ...user }
    next()
}

/**
 * 角色校验中间件：仅允许 admin 角色通过
 *
 * 注意区分 401 和 403：
 * - 401 Unauthorized：不知道你是谁（没登录 / Token 失效）
 * - 403 Forbidden：知道你是谁，但你没有权限
 *
 * 使用方式：app.delete('/api/employees/:id', auth, adminOnly, handler)
 * 必须放在 auth 之后，因为它依赖 req.user
 */
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json(fail(403, '没有权限执行此操作'))
    }
    next()
}

// ---------- 用户相关接口 ----------

/**
 * 接口：登录
 * 请求方式：POST /api/login
 * 请求参数：{ username, password }
 * 返回：{ token }
 */
app.post('/api/login', (req, res) => {
    const { username, password } = req.body
    const user = users[username]

    // 账号不存在或密码错误
    if (!user || user.password !== password) {
        return res.json(fail(400, '用户名或密码错误'))
    }

    // 生成简化版 Token（真实项目用 JWT）
    res.json(ok({ token: `token-${username}` }))
})

/**
 * 接口：获取当前登录用户信息（需要登录）
 * 请求方式：GET /api/userinfo
 * 鉴权：Bearer Token
 * 返回：{ username, role, nickname }
 */
const handleGetUserInfo = (req, res) => {
    // auth 中间件已经把用户信息挂到了 req.user，这里直接取用
    const { username, role, nickname } = req.user
    // 注意：绝对不要把 password 返回给前端！
    res.json(ok({ username, role, nickname }))
}

// 同时兼容两种路径，防止前端路径写法不一致
app.get('/api/userinfo',   auth, handleGetUserInfo)
app.get('/api/user/info',  auth, handleGetUserInfo)

// ---------- 部门相关接口 ----------

/**
 * 接口：部门列表（所有已登录用户可访问，用于下拉选择等场景）
 * 请求方式：GET /api/departments
 * 鉴权：需要登录（auth），不限制角色
 */
app.get('/api/departments', auth, (req, res) => {
    res.json(ok(departments))
})

// ---------- 员工相关接口 ----------

/**
 * 接口：员工列表（支持分页 + 多条件搜索）
 * 请求方式：GET /api/employees
 * 查询参数：page, pageSize, name, departmentId, status
 */
app.get('/api/employees', auth, (req, res) => {
    const page     = Number(req.query.page)     || 1
    const pageSize = Number(req.query.pageSize) || 10
    const { name, departmentId, status } = req.query

    // 先过滤，再按 id 降序排列（最新添加的排最前面）
    const list = employees
        .filter((e) => {
            // 姓名模糊匹配
            if (name && !e.name.includes(name)) return false
            // 部门精确匹配
            if (departmentId && e.departmentId !== Number(departmentId)) return false
            // 状态精确匹配（注意：空字符串表示"全部"，不过滤）
            if (status !== undefined && status !== '' && e.status !== Number(status)) return false
            return true
        })
        .sort((a, b) => b.id - a.id)

    // 分页切片：取当前页的数据
    const rows = list
        .slice((page - 1) * pageSize, page * pageSize)
        .map((e) => ({
            ...e,
            // 把部门 ID 替换为部门名称，方便前端直接展示
            departmentName: departments.find((d) => d.id === e.departmentId)?.name
        }))

    res.json(ok({ list: rows, total: list.length }))
})

/**
 * 接口：新增员工
 * 请求方式：POST /api/employees
 * 请求体：员工表单数据
 */
app.post('/api/employees', auth, (req, res) => {
    if (!req.body.name) return res.json(fail(400, '姓名不能为空'))
    // 生成新 id，并使用 pickFields 白名单过滤，防止非法字段写入
    const emp = { id: nextId++, ...pickFields(req.body) }
    employees.push(emp)
    res.json(ok(emp))
})

/**
 * 接口：编辑员工
 * 请求方式：PUT /api/employees/:id
 * 路由参数：id（员工 ID）
 */
app.put('/api/employees/:id', auth, (req, res) => {
    const emp = employees.find((e) => e.id === Number(req.params.id))
    if (!emp) return res.json(fail(404, '员工不存在'))
    // Object.assign 把新数据合并到原对象上（只更新传入的字段）
    Object.assign(emp, pickFields(req.body))
    res.json(ok(emp))
})

/**
 * 接口：删除员工（仅管理员可操作）
 * 请求方式：DELETE /api/employees/:id
 * 权限：auth（已登录）+ adminOnly（仅 admin 角色）
 */
app.delete('/api/employees/:id', auth, adminOnly, (req, res) => {
    const index = employees.findIndex((e) => e.id === Number(req.params.id))
    if (index === -1) return res.json(fail(404, '员工不存在'))
    employees.splice(index, 1)   // 从数组中删除该元素
    res.json(ok(null))
})

/**
 * 接口：数据看板汇总数据
 * 请求方式：GET /api/dashboard
 * 鉴权：需要登录（auth）
 * 返回：{ stats, departmentStats, hireTrend }
 */
app.get('/api/dashboard', auth, (req, res) => {
    // 在职人数
    const active = employees.filter((e) => e.status === 1).length

    // 各部门人数——供饼图使用（ECharts 饼图要求格式：[{ name, value }]）
    const departmentStats = departments.map((d) => ({
        name:  d.name,
        value: employees.filter((e) => e.departmentId === d.id).length
    }))

    // 按月统计入职人数——供柱状图使用
    // 第一步：用 monthMap 对象统计每个月有多少人入职（键=月份字符串，值=人数）
    const monthMap = {}
    employees.forEach((e) => {
        const month = e.hireDate.slice(0, 7)  // 取 'YYYY-MM' 部分，如 '2022-03'
        monthMap[month] = (monthMap[month] || 0) + 1
    })
    // 第二步：把对象转成数组并按月份升序排列（ECharts 柱状图要求数组格式）
    const hireTrend = Object.keys(monthMap)
        .sort()
        .map((month) => ({ month, count: monthMap[month] }))  // month 变量名对应 map 回调参数

    res.json(ok({
        stats: {
            total:           employees.length,
            active,
            left:            employees.length - active,
            departmentCount: departments.length
        },
        departmentStats,
        hireTrend
    }))
})

// 启动服务，监听本地 3000 端口
app.listen(3000, () => {
    console.log('Mock server is running on http://localhost:3000')
})