<template>
	<pc-layout :active="activeKey" title="工作台">
		<!-- 欢迎横幅 -->
		<view class="welcome">
			<view class="w-left">
				<view class="w-hello">{{ greeting }}，{{ user.name }}</view>
				<view class="w-sub">{{ today }} · 欢迎使用在线题库与考试系统</view>
			</view>
			<view class="w-badge">{{ roleText[user.role] }}工作台</view>
		</view>

		<!-- 快捷功能 -->
		<view class="section-title">快捷功能</view>
		<view class="quick-grid">
			<view v-for="m in menus" :key="m.url" class="quick-item" @click="go(m.url)">
				<view class="qi-icon" :style="{ background: m.bg }">{{ m.icon }}</view>
				<view class="qi-text">
					<view class="qi-name">{{ m.label }}</view>
					<view class="qi-desc">{{ m.desc }}</view>
				</view>
			</view>
		</view>

		<!-- 使用提示 -->
		<view class="card tips-card">
			<view class="tips-title">💡 使用提示</view>
			<view class="tips-line" v-if="user.role === 'student'">进入「参加考试」查看可参加的考试；交卷后可在「我的成绩」查看分数与逐题解析，日常可通过「在线练习」巩固知识点。</view>
			<view class="tips-line" v-else-if="user.role === 'teacher'">先在「题库管理」录入试题并维护「分类管理」，再通过「自动组卷」智能抽题生成试卷；发布考试后在「在线阅卷」批改主观题。</view>
			<view class="tips-line" v-else>在「用户管理」维护师生账号，在「数据统计」查看平台整体运行数据与成绩分布。</view>
		</view>
	</pc-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getUser, requireLogin, ROLE_TEXT } from '@/common/auth.js'

const roleText = ROLE_TEXT
const user = ref({})
const activeKey = '/pages/index/index'

const MENUS = {
	student: [
		{ label: '参加考试', icon: '📝', bg: '#E8F0FF', desc: '查看并进入可参加的考试', url: '/pages/student/exam-list/exam-list' },
		{ label: '我的成绩', icon: '📊', bg: '#E6F7EC', desc: '历次考试成绩与解析', url: '/pages/student/my-scores/my-scores' },
		{ label: '在线练习', icon: '🎯', bg: '#FFF3E4', desc: '随机练习与错题复习', url: '/pages/student/practice/practice' }
	],
	teacher: [
		{ label: '题库管理', icon: '📚', bg: '#E8F0FF', desc: '试题录入、筛选与维护', url: '/pages/teacher/question-bank/question-bank' },
		{ label: '分类管理', icon: '🗂️', bg: '#F0F2F5', desc: '知识点分类维护', url: '/pages/teacher/category-manage/category-manage' },
		{ label: '自动组卷', icon: '⚙️', bg: '#FFF3E4', desc: '按规则智能抽题组卷', url: '/pages/teacher/paper-gen/paper-gen' },
		{ label: '试卷管理', icon: '📄', bg: '#F3E8FF', desc: '试卷预览与管理', url: '/pages/teacher/paper-list/paper-list' },
		{ label: '考试管理', icon: '📋', bg: '#E0F7FA', desc: '发布考试与过程管控', url: '/pages/teacher/exam-manage/exam-manage' },
		{ label: '在线阅卷', icon: '✅', bg: '#FDECEC', desc: '答卷批改与评分', url: '/pages/teacher/grading-list/grading-list' }
	],
	admin: [
		{ label: '用户管理', icon: '👥', bg: '#E8F0FF', desc: '师生账号维护与授权', url: '/pages/admin/users/users' },
		{ label: '数据统计', icon: '📈', bg: '#E6F7EC', desc: '平台数据总览分析', url: '/pages/admin/stats/stats' }
	]
}

const menus = computed(() => MENUS[user.value.role] || [])

const greeting = computed(() => {
	const h = new Date().getHours()
	if (h < 6) return '凌晨好'
	if (h < 9) return '早上好'
	if (h < 12) return '上午好'
	if (h < 14) return '中午好'
	if (h < 18) return '下午好'
	return '晚上好'
})

const today = computed(() => {
	const d = new Date()
	const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
	return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${week}`
})

onShow(() => {
	if (!requireLogin()) return
	user.value = getUser()
})

function go(url) {
	uni.navigateTo({ url })
}
</script>

<style scoped>
/* 欢迎横幅 */
.welcome {
	background: linear-gradient(135deg, #3B7CFF 0%, #5A8DFF 60%, #6B9DFF 100%);
	border-radius: 14rpx;
	padding: 40rpx 40rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 28rpx;
	box-shadow: 0 8rpx 24rpx rgba(59, 124, 255, 0.25);
}

.w-hello {
	color: #fff;
	font-size: 38rpx;
	font-weight: 700;
}

.w-sub {
	color: rgba(255, 255, 255, 0.82);
	font-size: 24rpx;
	margin-top: 12rpx;
}

.w-badge {
	background: rgba(255, 255, 255, 0.18);
	border: 1rpx solid rgba(255, 255, 255, 0.4);
	color: #fff;
	font-size: 24rpx;
	padding: 10rpx 28rpx;
	border-radius: 999rpx;
	flex-shrink: 0;
}

.qi-text {
	min-width: 0;
}

/* 使用提示卡 */
.tips-card {
	margin-top: 28rpx;
	background: #F8FAFF;
	border: 1rpx solid #E8EFFF;
}

.tips-title {
	font-size: 27rpx;
	font-weight: 600;
	color: #3B7CFF;
	margin-bottom: 12rpx;
}

.tips-line {
	font-size: 25rpx;
	color: #606266;
	line-height: 1.8;
}
</style>
