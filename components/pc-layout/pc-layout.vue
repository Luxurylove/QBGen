<template>
	<view class="pc-layout">
		<!-- 移动端遮罩 -->
		<view v-if="mobileOpen" class="pc-mask" @click="mobileOpen = false"></view>

		<!-- ===== 深色侧边栏 ===== -->
		<view class="sidebar" :class="{ open: mobileOpen }">
			<!-- 品牌区 -->
			<view class="brand">
				<view class="brand-logo">Q</view>
				<view class="brand-text">
					<view class="brand-name">题库考试系统</view>
					<view class="brand-sub">QBGen · v1.0</view>
				</view>
			</view>

			<!-- 菜单 -->
			<scroll-view scroll-y class="menu-scroll">
				<view class="menu-group">
					<view
						v-for="m in menus"
						:key="m.key"
						class="menu-item"
						:class="{ active: m.key === active }"
						@click="goMenu(m)"
					>
						<text class="menu-icon">{{ m.icon }}</text>
						<text class="menu-label">{{ m.label }}</text>
					</view>
				</view>
			</scroll-view>

			<!-- 底部用户区 -->
			<view class="side-user">
				<view class="su-avatar">{{ user.name ? user.name[0] : '?' }}</view>
				<view class="su-info">
					<view class="su-name">{{ user.name }}</view>
					<view class="su-role">{{ roleText[user.role] }}</view>
				</view>
			</view>
		</view>

		<!-- ===== 右侧主区域 ===== -->
		<view class="main">
			<!-- 顶部栏 -->
			<view class="topbar">
				<view class="tb-left">
					<text class="tb-toggle" @click="mobileOpen = true">☰</text>
					<text class="tb-title">{{ title }}</text>
				</view>
				<view class="tb-right">
					<slot name="topbar"></slot>
				</view>
			</view>

			<!-- 页面内容 -->
			<view class="content">
				<slot></slot>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getUser, ROLE_TEXT } from '@/common/auth.js'

defineProps({
	// 当前页面菜单标识（子页面可传所属父菜单 key 以保持高亮）
	active: { type: String, default: '' },
	// 顶部栏标题
	title: { type: String, default: '' }
})

const user = getUser()
const roleText = ROLE_TEXT
const mobileOpen = ref(false)

// 三角色菜单：key 与 pages.json 路由一致
const MENUS = {
	student: [
		{ key: '/pages/index/index', label: '工作台', icon: '🏠' },
		{ key: '/pages/student/exam-list/exam-list', label: '参加考试', icon: '📝' },
		{ key: '/pages/student/my-scores/my-scores', label: '我的成绩', icon: '📊' },
		{ key: '/pages/student/practice/practice', label: '在线练习', icon: '🎯' },
		{ key: '/pages/profile/profile', label: '个人信息', icon: '👤' }
	],
	teacher: [
		{ key: '/pages/index/index', label: '工作台', icon: '🏠' },
		{ key: '/pages/teacher/question-bank/question-bank', label: '题库管理', icon: '📚' },
		{ key: '/pages/teacher/category-manage/category-manage', label: '分类管理', icon: '🗂️' },
		{ key: '/pages/teacher/paper-gen/paper-gen', label: '自动组卷', icon: '⚙️' },
		{ key: '/pages/teacher/paper-list/paper-list', label: '试卷管理', icon: '📄' },
		{ key: '/pages/teacher/exam-manage/exam-manage', label: '考试管理', icon: '📋' },
		{ key: '/pages/teacher/grading-list/grading-list', label: '在线阅卷', icon: '✅' },
		{ key: '/pages/profile/profile', label: '个人信息', icon: '👤' }
	],
	admin: [
		{ key: '/pages/index/index', label: '工作台', icon: '🏠' },
		{ key: '/pages/admin/users/users', label: '用户管理', icon: '👥' },
		{ key: '/pages/admin/stats/stats', label: '数据统计', icon: '📈' },
		{ key: '/pages/profile/profile', label: '个人信息', icon: '👤' }
	]
}

const menus = computed(() => MENUS[user.role] || [])

function goMenu(m) {
	mobileOpen.value = false
	uni.reLaunch({ url: m.key })
}
</script>

<style scoped>
.pc-layout {
	min-height: 100vh;
	background: #F4F6FA;
}

/* ===== 侧边栏 ===== */
.sidebar {
	position: fixed;
	left: 0;
	top: 0;
	bottom: 0;
	width: 230px;
	background: linear-gradient(180deg, #1C2B4A 0%, #152238 100%);
	display: flex;
	flex-direction: column;
	z-index: 200;
	box-shadow: 2rpx 0 12rpx rgba(0, 0, 0, 0.15);
}

/* 品牌区 */
.brand {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 32rpx 28rpx;
	border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);
}

.brand-logo {
	width: 64rpx;
	height: 64rpx;
	border-radius: 14rpx;
	background: linear-gradient(135deg, #3B7CFF, #6B9DFF);
	color: #fff;
	font-size: 36rpx;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.brand-name {
	color: #fff;
	font-size: 28rpx;
	font-weight: 600;
	line-height: 1.3;
}

.brand-sub {
	color: rgba(255, 255, 255, 0.4);
	font-size: 20rpx;
	margin-top: 4rpx;
}

/* 菜单 */
.menu-scroll {
	flex: 1;
	min-height: 0;
}

.menu-group {
	padding: 16rpx 14rpx;
}

.menu-item {
	display: flex;
	align-items: center;
	gap: 18rpx;
	padding: 20rpx 22rpx;
	border-radius: 10rpx;
	margin-bottom: 6rpx;
	position: relative;
	transition: background 0.15s ease;
}

.menu-icon {
	font-size: 28rpx;
	flex-shrink: 0;
}

.menu-label {
	color: rgba(255, 255, 255, 0.72);
	font-size: 27rpx;
}

@media (min-width: 769px) {
	.menu-item:hover {
		background: rgba(255, 255, 255, 0.06);
		cursor: pointer;
	}

	.menu-item:hover .menu-label {
		color: #fff;
	}
}

.menu-item.active {
	background: linear-gradient(135deg, #3B7CFF, #4C88FF);
	box-shadow: 0 6rpx 16rpx rgba(59, 124, 255, 0.35);
}

.menu-item.active .menu-label {
	color: #fff;
	font-weight: 600;
}

/* 底部用户 */
.side-user {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 24rpx 28rpx;
	border-top: 1rpx solid rgba(255, 255, 255, 0.06);
}

.su-avatar {
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	background: rgba(59, 124, 255, 0.9);
	color: #fff;
	font-size: 28rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.su-name {
	color: #fff;
	font-size: 26rpx;
	font-weight: 600;
}

.su-role {
	color: rgba(255, 255, 255, 0.45);
	font-size: 20rpx;
	margin-top: 4rpx;
}

/* ===== 主区域 ===== */
.main {
	margin-left: 230px;
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	min-width: 0;
}

/* 顶部栏 */
.topbar {
	position: sticky;
	top: 0;
	height: 56px;
	background: #fff;
	border-bottom: 1rpx solid #E8EBF0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 28rpx;
	z-index: 100;
	box-shadow: 0 1rpx 6rpx rgba(0, 0, 0, 0.03);
}

.tb-left {
	display: flex;
	align-items: center;
	gap: 18rpx;
	min-width: 0;
}

.tb-toggle {
	display: none;
	font-size: 36rpx;
	color: #606266;
	padding: 8rpx;
}

.tb-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #1F2937;
}

.tb-right {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

/* 内容区 */
.content {
	flex: 1;
	padding: 24rpx 28rpx 40rpx;
}

/* ===== 移动端 / 窄屏：侧边栏变抽屉 ===== */
.pc-mask {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.45);
	z-index: 150;
}

@media (max-width: 768px) {
	.sidebar {
		transform: translateX(-100%);
		transition: transform 0.22s ease;
	}

	.sidebar.open {
		transform: translateX(0);
	}

	.main {
		margin-left: 0;
	}

	.tb-toggle {
		display: inline-block;
	}
}
</style>
