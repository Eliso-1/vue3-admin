/**
 * src/api/department.js —— 部门相关接口模块
 */
import request from '@/utils/request'

/**
 * 获取部门列表（用于下拉选项等）
 * @returns {Promise<Array>} 部门数组，如 [{ id: 1, name: '研发部' }, ...]
 */
export const getDepartmentListApi = () => request.get('/departments')