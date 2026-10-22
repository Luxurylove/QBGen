<template>
	<view class="login-page">
		<view class="bg-decor decor-1"></view>
		<view class="bg-decor decor-2"></view>

		<view class="login-wrap">
			<!-- 品牌区 -->
			<view class="logo-area">
				<view class="logo-icon">
					<text class="logo-letter">Q</text>
				</view>
				<view class="title">在线题库与考试系统</view>
				<view class="subtitle">基于 uni-app + uniCloud Serverless 架构</view>
			</view>

			<!-- 登录卡片 -->
			<view class="form-card">
				<view class="card-title">账号登录</view>

				<!-- 账号 -->
				<view class="input-group" :class="{ focused: focusUser }">
					<text class="input-icon">👤</text>
					<input
						class="input"
						v-model="username"
						placeholder="请输入账号"
						placeholder-class="ph"
						@focus="focusUser = true"
						@blur="focusUser = false"
					/>
					<text v-if="username" class="clear-btn" @click="username = ''">✕</text>
				</view>

				<!-- 密码 -->
				<view class="input-group" :class="{ focused: focusPwd }">
					<text class="input-icon">🔒</text>
					<input
						class="input"
						v-model="password"
						:password="!showPwd"
						placeholder="请输入密码"
						placeholder-class="ph"
						@focus="focusPwd = true"
						@blur="focusPwd = false"
						@confirm="doLogin"
					/>
					<text class="eye-btn" @click="showPwd = !showPwd">{{ showPwd ? '🙈' : '👁️' }}</text>
				</view>

				<button class="btn-primary btn-block" :disabled="loading" @click="doLogin">
					<text v-if="loading" class="loading-dot"></text>
					{{ loading ? '登录中...' : '登 录' }}
				</button>
			</view>

			<!-- 演示账号 -->
			<view class="demo-tip">
				<view class="demo-label">演示账号（点击自动填充）</view>
				<view class="demo-row">
					<view class="demo-card card-tap" @click="fill('admin', 'admin123')">
						<view class="demo-role">管理员</view>
						<view class="demo-account">admin</view>
					</view>
					<view class="demo-card card-tap" @click="fill('teacher1', '123456')">
						<view class="demo-role">教师</view>
						<view class="demo-account">teacher1</view>
					</view>
					<view class="demo-card card-tap" @click="fill('student1', '123456')">
						<view class="demo-role">学生</view>
						<view class="demo-account">student1</view>
					</view>
				</view>
				<view class="init-link" @click="initData">
					<text class="init-icon">⚡</text>
					首次使用？点此一键初始化演示数据
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { call } from '@/common/request.js'
import { setUser, getUser } from '@/common/auth.js'

const username = ref('')
const password = ref('')
const loading = ref(false)
const showPwd = ref(false)
const focusUser = ref(false)
const focusPwd = ref(false)

onShow(() => {
	if (getUser().uid) {
		uni.reLaunch({ url: '/pages/index/index' })
	}
})

function fill(u, p) {
	username.value = u
	password.value = p
}

async function doLogin() {
	if (!username.value || !password.value) {
		uni.showToast({ title: '请输入账号和密码', icon: 'none' })
		return
	}
	loading.value = true
	try {
		const user = await call('qb-auth', 'login', {
			username: username.value,
			password: password.value
		})
		setUser(user)
		uni.reLaunch({ url: '/pages/index/index' })
	} finally {
		loading.value = false
	}
}

function initData() {
	uni.showModal({
		title: '初始化演示数据',
		content: '将清空并重新写入演示数据（用户、分类、题目、试卷、考试），是否继续？',
		success: async (res) => {
			if (!res.confirm) return
			uni.showLoading({ title: '初始化中...' })
			try {
				await call('qb-init', 'run')
				uni.hideLoading()
				uni.showToast({ title: '初始化完成，请登录', icon: 'success' })
			} catch (e) {
				uni.hideLoading()
			}
		}
	})
}
</script>

<style scoped>
.login-page {
	min-height: 100vh;
	background: linear-gradient(180deg, #F0F5FF 0%, #F4F6FA 50%, #F4F6FA 100%);
	position: relative;
	overflow: hidden;
}

.bg-decor {
	position: absolute;
	border-radius: 50%;
	pointer-events: none;
}

.decor-1 {
	width: 600rpx;
	height: 600rpx;
	background: linear-gradient(135deg, rgba(59, 124, 255, 0.12), rgba(107, 157, 255, 0.04));
	top: -180rpx;
	right: -150rpx;
}

.decor-2 {
	width: 400rpx;
	height: 400rpx;
	background: linear-gradient(135deg, rgba(25, 161, 95, 0.1), rgba(59, 124, 255, 0.04));
	bottom: 100rpx;
	left: -120rpx;
}

.login-wrap {
	position: relative;
	padding: 140rpx 44rpx 40rpx;
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
	/* PC 宽屏：内容限宽居中，避免登录卡片被拉满整屏 */
	width: 100%;
	max-width: 480px;
	margin: 0 auto;
}

/* ===== 品牌区 ===== */
.logo-area {
	text-align: center;
	margin-bottom: 56rpx;
}

.logo-icon {
	width: 128rpx;
	height: 128rpx;
	border-radius: 32rpx;
	background: linear-gradient(135deg, #3B7CFF 0%, #6B9DFF 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 28rpx;
	box-shadow: 0 12rpx 32rpx rgba(59, 124, 255, 0.35);
}

.logo-letter {
	color: #fff;
	font-size: 68rpx;
	font-weight: 800;
	line-height: 1;
}

.title {
	font-size: 44rpx;
	font-weight: 700;
	color: #1F2937;
	letter-spacing: 2rpx;
}

.subtitle {
	font-size: 24rpx;
	color: #9CA3AF;
	margin-top: 14rpx;
	letter-spacing: 1rpx;
}

/* ===== 登录卡片 ===== */
.form-card {
	background: #fff;
	border-radius: 24rpx;
	padding: 40rpx 36rpx 36rpx;
	box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.06);
}

.card-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #1F2937;
	margin-bottom: 32rpx;
}

/* ===== 输入框组 ===== */
.input-group {
	display: flex;
	align-items: center;
	background: #F8FAFC;
	border: 2rpx solid #E5E7EB;
	border-radius: 14rpx;
	padding: 0 24rpx;
	margin-bottom: 24rpx;
	height: 88rpx;
	transition: all 0.2s ease;
}

.input-group.focused {
	background: #fff;
	border-color: #3B7CFF;
	box-shadow: 0 0 0 4rpx rgba(59, 124, 255, 0.1);
}

.input-icon {
	font-size: 32rpx;
	margin-right: 16rpx;
	flex-shrink: 0;
}

.input {
	flex: 1;
	height: 88rpx;
	font-size: 30rpx;
	color: #1F2937;
}

.ph {
	color: #B0B7C3;
}

.clear-btn,
.eye-btn {
	font-size: 28rpx;
	color: #B0B7C3;
	padding: 8rpx;
	flex-shrink: 0;
}

.eye-btn {
	font-size: 32rpx;
}

/* ===== 登录按钮 ===== */
.btn-block {
	width: 100%;
	height: 88rpx;
	line-height: 88rpx;
	margin-top: 12rpx;
	border-radius: 14rpx;
	font-size: 32rpx;
	font-weight: 600;
	letter-spacing: 8rpx;
}

.btn-block:active {
	opacity: 0.85;
	transform: scale(0.99);
}

.loading-dot {
	display: inline-block;
	width: 28rpx;
	height: 28rpx;
	border: 4rpx solid rgba(255, 255, 255, 0.4);
	border-top-color: #fff;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
	margin-right: 12rpx;
	vertical-align: middle;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

/* ===== 演示账号 ===== */
.demo-tip {
	margin-top: 48rpx;
	text-align: center;
}

.demo-label {
	font-size: 24rpx;
	color: #9CA3AF;
	margin-bottom: 20rpx;
}

.demo-row {
	display: flex;
	justify-content: center;
	gap: 16rpx;
	margin-bottom: 28rpx;
}

.demo-card {
	flex: 1;
	background: #fff;
	border: 2rpx solid #EEF2F7;
	border-radius: 14rpx;
	padding: 18rpx 0;
	text-align: center;
	transition: all 0.15s ease;
}

.demo-card:active {
	background: #F0F5FF;
	border-color: #3B7CFF;
	transform: scale(0.97);
}

.demo-role {
	font-size: 24rpx;
	color: #6B7280;
	margin-bottom: 4rpx;
}

.demo-account {
	font-size: 26rpx;
	font-weight: 600;
	color: #3B7CFF;
}

.init-link {
	color: #6B7280;
	font-size: 24rpx;
	padding: 12rpx 0;
}

.init-icon {
	margin-right: 4rpx;
}

/* ===== PC 宽屏优化：顶部留白收紧、卡片层次增强 ===== */
@media (min-width: 900px) {
	.login-wrap {
		justify-content: center;
		padding: 60px 32px 40px;
	}

	.logo-area {
		margin-bottom: 40px;
	}

	.form-card {
		border-radius: 16px;
		padding: 40px 36px 36px;
		box-shadow: 0 18px 48px rgba(31, 41, 55, 0.1);
	}

	.demo-tip {
		margin-top: 40px;
	}

	.demo-card {
		border-radius: 12px;
		padding: 14px 0;
	}

	.demo-card:hover {
		background: #F0F5FF;
		border-color: #3B7CFF;
	}
}
</style>
