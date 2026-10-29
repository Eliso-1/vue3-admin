<!--
  Header.vue —— 顶栏组件

  功能：
  1. 左侧：折叠/展开侧边栏按钮 + 员工搜索框（支持 ⌘K / Ctrl+K 快捷键聚焦）
  2. 右侧：组织通讯录入口、人事助手按钮、用户头像下拉菜单（退出登录）
-->
<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
// 注意：ElMessage / ElMessageBox 是"函数式 API"，显式 import 不会自动带上样式，
// 必须手动引入对应的 CSS，否则弹窗能创建出来却看不见（没有样式的"隐形弹窗"）
import { ElMessage, ElMessageBox } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'

// defineModel：双向绑定父组件传来的"侧边栏是否折叠"状态
// 父组件的用法：<Header v-model:is-collapse="isCollapse" />
// 这里修改 isCollapse，父组件 Layout 里的值会同步变化
const isCollapse = defineModel('isCollapse', { type: Boolean })
const router = useRouter()
const userStore = useUserStore()

// 搜索框的 DOM 引用（用于代码主动聚焦输入框）
const searchInput = ref()
// 搜索框内容（模板里 v-model 绑定）
const searchTerm = ref('')

// 头像上显示的字：取昵称第一个字，取不到就显示"管"
const avatarText = computed(() => userStore.userInfo?.nickname?.slice(0, 1) || '管')

// 点击"人事助手"按钮：功能还没开发，先弹个提示占位
const showAssistantNotice = () => ElMessage.info('人事助手暂未开放')

// 让搜索框获得焦点（点击搜索区域、或按快捷键时调用）
function focusSearch() {
    searchInput.value?.focus()
}

/**
 * 快捷键：Mac 按 ⌘K、Windows 按 Ctrl+K，直接聚焦搜索框
 * event.metaKey = Mac 的 ⌘ 键；event.ctrlKey = Windows 的 Ctrl 键
 * preventDefault() 阻止浏览器默认行为（比如 Chrome 里 ⌘K 是地址栏搜索）
 */
function handleSearchKeydown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        focusSearch()
    }
}

/**
 * 回车搜索：跳到员工页，并通过 URL 参数 ?name=xxx 带上搜索词
 * 员工页里有 watch 监听 route.query.name，会自动按姓名过滤列表
 */
function handleSearch() {
    const name = searchTerm.value.trim()
    if (!name) return // 空内容不搜索
    router.push({ path: '/employee', query: { name } })
}

/**
 * 退出登录：
 * 1. 先弹确认框，用户点"取消"会进 catch，直接 return 什么都不做
 * 2. 确认后调用 store 的 logout()（清空 token 和用户信息）
 * 3. 跳回登录页
 */
async function handleLogout() {
    try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
    } catch {
        return
    }

    userStore.logout()
    router.push('/login')
}
</script>

<template>
    <header class="header" @keydown="handleSearchKeydown">
        <div class="header-start">
            <button
                class="collapse-button"
                type="button"
                :aria-label="isCollapse ? '展开侧边栏' : '折叠侧边栏'"
                @click="isCollapse = !isCollapse"
            >
                <el-icon><component :is="isCollapse ? 'Expand' : 'Fold'" /></el-icon>
            </button>
            <label class="search-box">
                <el-icon class="search-icon"><Search /></el-icon>
                <input
                    v-model="searchTerm"
                    ref="searchInput"
                    type="search"
                    placeholder="搜索员工姓名..."
                    aria-label="搜索员工姓名"
                    @keydown.enter="handleSearch"
                />
                <kbd><span>⌘</span> K</kbd>
            </label>
        </div>

        <div class="header-actions">
            <span class="approval-chip"><i />员工数据</span>
            <button class="directory-button" type="button" @click="router.push('/employee')">
                <el-icon><User /></el-icon>
                <span>组织通讯录</span>
            </button>
            <button class="assistant-button" type="button" @click="showAssistantNotice">
                <el-icon><Star /></el-icon>
                <span>人事助手</span>
            </button>

            <el-dropdown>
                <button class="avatar-button" type="button" aria-label="用户菜单">
                    <el-avatar :size="34">{{ avatarText }}</el-avatar>
                </button>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item disabled>{{ userStore.userInfo?.nickname || '管理员' }}</el-dropdown-item>
                        <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
    </header>
</template>

<style lang="scss" scoped>
.header {
    display: flex;
    height: 68px;
    flex: 0 0 68px;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 0 17px 0 22px;
    border-bottom: 1px solid #e9e8e7;
    background: #fff;
}

.header-start {
    display: flex;
    min-width: 0;
    flex: 1;
    align-items: center;
    gap: 14px;
}

.collapse-button {
    display: grid;
    width: 22px;
    height: 30px;
    flex: 0 0 22px;
    place-items: center;
    padding: 0;
    border: 0;
    background: transparent;
    color: #777;
    cursor: pointer;
    font-size: 17px;
}

.search-box {
    display: flex;
    width: min(100%, 462px);
    height: 40px;
    align-items: center;
    gap: 10px;
    padding: 0 12px;
    border: 1px solid transparent;
    border-radius: 11px;
    background: #f5f5f4;
    color: #888;
    transition: border-color 0.15s, background-color 0.15s;

    &:focus-within {
        border-color: #deddd9;
        background: #fff;
    }

    input {
        width: 100%;
        min-width: 0;
        padding: 0;
        border: 0;
        outline: 0;
        background: transparent;
        color: #303030;
        font: inherit;
        font-size: 13px;

        &::placeholder {
            color: #999;
        }

        &::-webkit-search-cancel-button {
            cursor: pointer;
        }
    }

    kbd {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        flex: 0 0 auto;
        padding: 3px 6px;
        border: 1px solid #e5e4e2;
        border-radius: 5px;
        background: #fafafa;
        color: #777;
        font-family: inherit;
        font-size: 10px;
        line-height: 1.2;
    }
}

.search-icon {
    flex: 0 0 auto;
    font-size: 15px;
}

.header-actions {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 9px;
}

.approval-chip,
.directory-button,
.assistant-button {
    display: inline-flex;
    height: 36px;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 0 12px;
    border: 1px solid #e8e7e5;
    border-radius: 11px;
    background: #fff;
    color: #414141;
    font: inherit;
    font-size: 12px;
    white-space: nowrap;
}

.approval-chip {
    border-color: #f2d594;
    color: #a8740a;

    i {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #efa900;
    }
}

.directory-button,
.assistant-button {
    cursor: pointer;
    transition: background-color 0.15s;

    &:hover {
        background: #f7f7f6;
    }
}

.assistant-button {
    border-color: #202020;
    background: #202020;
    color: #fff;
    font-weight: 600;

    &:hover {
        background: #383838;
    }
}

.avatar-button {
    display: grid;
    width: 36px;
    height: 36px;
    place-items: center;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    cursor: pointer;

    :deep(.el-avatar) {
        border: 2px solid #fff;
        background: #ef8b7b;
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        box-shadow: 0 0 0 1px #f0dfda;
    }
}

@media (max-width: 900px) {
    .approval-chip {
        display: none;
    }
}

@media (max-width: 680px) {
    .header {
        gap: 8px;
        padding: 0 11px;
    }

    .header-start {
        gap: 7px;
    }

    .header-actions {
        gap: 6px;
    }

    .directory-button {
        width: 36px;
        padding: 0;

        span {
            display: none;
        }
    }

    .assistant-button {
        width: 36px;
        padding: 0;

        span {
            display: none;
        }
    }

    .search-box {
        height: 38px;
        gap: 7px;
        padding: 0 9px;

        kbd {
            display: none;
        }
    }
}
</style>
