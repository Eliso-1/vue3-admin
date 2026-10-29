/**
 * src/api/dashboard.js —— 数据看板相关接口模块
 */
import request from '@/utils/request'

/**
 * 获取看板汇总数据（统计卡片 + 饼图 + 柱状图）
 * @returns {Promise<{ stats, departmentStats, hireTrend }>}
 *   - stats:           { total, active, left, departmentCount } 顶部四张统计卡片的数字
 *   - departmentStats: [{ name, value }] 各部门人数，供饼图使用
 *   - hireTrend:       [{ month, count }] 按月入职人数，供柱状图使用
 */
export const getDashboardApi = () => request.get('/dashboard')