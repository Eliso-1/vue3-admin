/**
 * src/api/employee.js —— 员工相关接口模块
 *
 * 规范做法：每个业务模块的接口单独放一个文件，方便查找和维护
 */
import request from '@/utils/request'

/**
 * 获取员工列表（支持分页 + 搜索）
 * @param {Object} params 查询参数，如 { page, pageSize, name, departmentId, status }
 * @returns {Promise<{ list: Array, total: number }>}
 */
export const getEmployeeListApi = (params) => request.get('/employees', { params })

/**
 * 新增员工
 * @param {Object} data 员工表单数据
 */
export const createEmployeeApi = (data) => request.post('/employees', data)

/**
 * 编辑员工
 * @param {number} id   员工 ID
 * @param {Object} data 修改后的表单数据
 */
export const updateEmployeeApi = (id, data) => request.put(`/employees/${id}`, data)

/**
 * 删除员工（仅 admin 角色可操作，普通用户会收到 403）
 * @param {number} id 员工 ID
 */
export const deleteEmployeeApi = (id) => request.delete(`/employees/${id}`)