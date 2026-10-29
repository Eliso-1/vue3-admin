<!--
  Sidebar.vue —— 侧边栏导航

  功能：
  1. 品牌 Logo 区（Atlas AI）
  2. 分组菜单：数据来自 permissionStore（登录后按角色过滤的动态路由）
     - "工作台"组：数据看板、员工管理
     - "组织管理"组：部门管理
  3. 底部：系统设置入口（仅 admin 可见） + 当前登录用户信息
  4. 响应式：窗口 ≤760px 自动进入窄屏模式（只显示图标）
  5. 支持手动折叠（点顶栏按钮），窄屏下强制折叠
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
// 菜单数据来自权限 store（登录后按角色动态生成的路由，菜单跟着权限走）
import { usePermissionStore } from '@/stores/permission'
// 用户信息（底部显示昵称和头像字）
import { useUserStore } from '@/stores/user'

// 父组件传入：侧边栏是否折叠（点顶栏按钮切换）
const props = defineProps({
    isCollapse: Boolean
})

/**
 * 响应式布局：用浏览器原生 matchMedia 监听"窗口宽度 ≤760px"这个条件
 * - mobileQuery.matches：当前是否处于窄屏
 * - 拖动窗口大小跨越 760px 时会触发 change 事件，实时更新 isMobile
 */
const mobileQuery = window.matchMedia('(max-width: 760px)')
const isMobile = ref(mobileQuery.matches)

const route = useRoute()
const permissionStore = usePermissionStore()
const userStore = useUserStore()

// 菜单数据：权限 store 里按角色过滤好的动态路由
const menus = computed(() => permissionStore.menuRoutes)
// 当前激活的菜单路径（el-menu 用它来高亮当前页对应的菜单项）
const activePath = computed(() => route.path)
// 最终是否折叠：手动折叠 或 处于窄屏，任一满足就折叠
const menuCollapsed = computed(() => props.isCollapse || isMobile.value)

/**
 * 把菜单手动分成两组展示，分组和顺序在这里定义：
 * - "工作台"：dashboard（数据看板）、employee（员工管理）
 * - "组织管理"：department（部门管理）
 * 最后的 .filter：如果某组一条菜单都没有（比如普通用户没有部门权限），整组直接隐藏
 */
const mainGroups = computed(() => [
    {
        title: '工作台',
        items: menus.value.filter((item) => ['dashboard', 'employee'].includes(item.path))
    },
    {
        title: '组织管理',
        items: menus.value.filter((item) => item.path === 'department')
    }
].filter((group) => group.items.length))

// "系统设置"路由单独放侧边栏底部（meta.roles 只有 admin，普通用户这里自然为空不显示）
const settingsRoute = computed(() => menus.value.find((item) => item.path === 'setting'))

const displayName = computed(() => userStore.userInfo?.nickname || '管理员')
const avatarText = computed(() => displayName.value.slice(0, 1))

// 窗口宽度跨越 760px 阈值时，matchMedia 会回调这里，同步 isMobile 的值
function updateMobileState(event) {
    isMobile.value = event.matches
}

// 挂载后开始监听窗口变化；卸载前移除监听（防止内存泄漏）
onMounted(() => mobileQuery.addEventListener('change', updateMobileState))
onBeforeUnmount(() => mobileQuery.removeEventListener('change', updateMobileState))
</script>

<template>
    <div class="sidebar" :class="{ 'is-collapsed': menuCollapsed }">
        <div class="brand">
            <span class="brand-mark"><el-icon><Star /></el-icon></span>
            <span v-if="!menuCollapsed" class="brand-name">Atlas AI</span>
        </div>

        <nav class="navigation" aria-label="主导航">
            <section v-for="group in mainGroups" :key="group.title" class="menu-group">
                <h2 v-if="!menuCollapsed" class="group-title">{{ group.title }}</h2>
                <el-menu
                    :default-active="activePath"
                    :collapse="menuCollapsed"
                    :collapse-transition="false"
                    router
                >
                    <el-menu-item
                        v-for="item in group.items"
                        :key="item.path"
                        :index="`/${item.path}`"
                    >
                        <el-icon><component :is="item.meta.icon" /></el-icon>
                        <template #title>{{ item.meta.title === '数据看板' ? '数据概览' : item.meta.title }}</template>
                    </el-menu-item>
                </el-menu>
            </section>
        </nav>

        <div class="sidebar-bottom">
            <el-menu
                v-if="settingsRoute"
                :default-active="activePath"
                :collapse="menuCollapsed"
                :collapse-transition="false"
                router
            >
                <el-menu-item :index="`/${settingsRoute.path}`">
                    <el-icon><component :is="settingsRoute.meta.icon" /></el-icon>
                    <template #title>{{ settingsRoute.meta.title }}</template>
                </el-menu-item>
            </el-menu>

            <div class="account">
                <el-avatar :size="34">{{ avatarText }}</el-avatar>
                <div class="account-info">
                    <strong>{{ displayName }}</strong>
                    <span><i />在线</span>
                </div>
            </div>
            <div class="collapsed-avatar">
                <el-avatar :size="32">{{ avatarText }}</el-avatar>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.sidebar {
    display: flex;
    height: 100%;
    min-height: 0;
    flex-direction: column;
    background: #fff;
}

.brand {
    display: flex;
    height: 68px;
    flex: 0 0 68px;
    align-items: center;
    gap: 11px;
    padding: 0 22px;
    border-bottom: 1px solid #ecebea;
}

.brand-mark {
    display: grid;
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
    place-items: center;
    border-radius: 10px;
    background: #1c1c1c;
    color: #fff;
    font-size: 15px;
}

.brand-name {
    color: #202020;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.3px;
}

.navigation {
    flex: 1;
    overflow-y: auto;
    padding: 15px 13px;
}

.menu-group + .menu-group {
    margin-top: 21px;
}

.group-title {
    margin: 0 9px 8px;
    color: #999;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.3px;
}

.el-menu {
    border-right: 0;
    background: transparent;

    :deep(.el-menu-item) {
        height: 42px;
        margin: 2px 0;
        padding: 0 11px !important;
        border-radius: 9px;
        color: #555;
        font-size: 13px;
        line-height: 42px;

        .el-icon {
            color: #626262;
            font-size: 17px;
        }

        &:hover {
            background: #f7f7f6;
            color: #222;
        }

        &.is-active {
            background: #f0f0ef;
            color: #1f1f1f;
            font-weight: 650;

            .el-icon {
                color: #1f1f1f;
            }
        }
    }
}

.sidebar-bottom {
    flex: 0 0 auto;
    padding: 0 13px 15px;
    border-top: 1px solid #ecebea;

    > .el-menu {
        margin: 8px 0 11px;
    }
}

.account {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 2px 9px;

    :deep(.el-avatar) {
        border: 2px solid #fff;
        background: #ee8b7b;
        color: white;
        font-size: 11px;
        font-weight: 700;
        box-shadow: 0 0 0 1px #f0e2de;
    }
}

.sidebar.is-collapsed .account {
    display: none;
}

.account-info {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 3px;

    strong {
        overflow: hidden;
        color: #252525;
        font-size: 12px;
        font-weight: 650;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    span {
        display: flex;
        align-items: center;
        gap: 5px;
        color: #888;
        font-size: 10px;
    }

    i {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #20b987;
    }
}

.collapsed-avatar {
    display: none;
    justify-content: center;
    padding-top: 7px;
}

.sidebar.is-collapsed .collapsed-avatar {
    display: flex;
}

@media (max-width: 760px) {
    .brand {
        justify-content: center;
        padding: 0;
    }

    .brand-name,
    .group-title,
    .account {
        display: none;
    }

    .navigation {
        padding-right: 7px;
        padding-left: 7px;
    }

    .collapsed-avatar {
        display: flex;
    }

    .sidebar-bottom {
        padding-right: 7px;
        padding-left: 7px;
    }

    .el-menu {
        :deep(.el-menu-item) {
            justify-content: center;
            padding: 0 !important;

            .el-icon {
                margin: 0;
            }

            > span {
                display: none;
            }
        }
    }
}
</style>
