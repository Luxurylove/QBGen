<template>
	<pc-layout :active="activeKey" title="个人信息">
		<view class="profile-wrap">
			<!-- 用户信息：蓝色渐变卡 -->
			<view class="user-card">
				<view class="avatar">{{ user.name ? user.name[0] : '' }}</view>
				<view class="info">
					<view class="name">{{ user.name }}</view>
					<view class="account">账号：{{ user.username }}</view>
					<text :class="['tag role-tag', roleTag[user.role]]">{{ roleText[user.role] }}</text>
				</view>
			</view>

			<!-- 修改密码 -->
			<view class="card pwd-card">
				<view class="card-title">修改密码</view>

				<!-- 原密码 -->
				<view class="field" :class="{ focused: focusOld }">
					<text class="field-icon">🔒</text>
					<input
						class="field-input"
						v-model="oldPassword"
						:password="!showOld"
						placeholder="请输入原密码"
						@focus="focusOld = true"
						@blur="focusOld = false"
					/>
					<text v-if="oldPassword" class="field-suffix" @click="showOld = !showOld">
						{{ showOld ? '🙈' : '👁️' }}
					</text>
				</view>

				<!-- 新密码 -->
				<view class="field" :class="{ focused: focusNew }">
					<text class="field-icon">🔐</text>
					<input
						class="field-input"
						v-model="newPassword"
						:password="!showNew"
						placeholder="至少 6 位"
						@focus="focusNew = true"
						@blur="focusNew = false"
					/>
					<text v-if="newPassword" class="field-suffix" @click="showNew = !showNew">
						{{ showNew ? '🙈' : '👁️' }}
					</text>
				</view>

				<!-- 确认新密码 -->
				<view class="field" :class="{ focused: focusConfirm }">
					<text class="field-icon">✅</text>
					<input
						class="field-input"
						v-model="confirmPassword"
						:password="!showConfirm"
						placeholder="再次输入新密码"
						@focus="focusConfirm = true"
						@blur="focusConfirm = false"
					/>
					<text v-if="confirmPassword" class="field-suffix" @click="showConfirm = !showConfirm">
						{{ showConfirm ? '🙈' : '👁️' }}
					</text>
				</view>

				<button class="btn-primary save-btn" @click="changePwd">保存新密码</button>
			</view>

			<!-- 退出登录 -->
			<button class="btn-danger btn-block logout" @click="logout">退出登录</button>
		</view>
	</pc-layout>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { call } from '@/common/request.js'
import { getUser, clearUser, requireLogin, ROLE_TEXT } from '@/common/auth.js'

const activeKey = '/pages/profile/profile'
const roleText = ROLE_TEXT
const roleTag = { student: 'tag-blue', teacher: 'tag-green', admin: 'tag-red' }
const user = ref({})
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// 输入框聚焦态与密码可见性
const focusOld = ref(false)
const focusNew = ref(false)
const focusConfirm = ref(false)
const showOld = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

onShow(() => {
	if (!requireLogin()) return
	user.value = getUser()
})

async function changePwd() {
	if (!oldPassword.value || !newPassword.value) {
		uni.showToast({ title: '请输入原密码和新密码', icon: 'none' })
		return
	}
	if (newPassword.value !== confirmPassword.value) {
		uni.showToast({ title: '两次输入的新密码不一致', icon: 'none' })
		return
	}
	await call('qb-auth', 'changePassword', {
		oldPassword: oldPassword.value,
		newPassword: newPassword.value
	})
	uni.showToast({ title: '密码已修改', icon: 'success' })
	oldPassword.value = newPassword.value = confirmPassword.value = ''
	showOld.value = showNew.value = showConfirm.value = false
}

function logout() {
	uni.showModal({
		title: '退出登录',
		content: '确定要退出当前账号吗？',
		success: (res) => {
			if (!res.confirm) return
			clearUser()
			uni.reLaunch({ url: '/pages/login/login' })
		}
	})
}
</script>

<style scoped>
/* 限宽容器：宽屏居中 */
.profile-wrap {
	max-width: 720px;
	margin: 0 auto;
}

/* 用户信息卡：蓝色渐变，白字 */
.user-card {
	display: flex;
	align-items: center;
	gap: 28rpx;
	padding: 40rpx 32rpx;
	border-radius: 12rpx;
	background: linear-gradient(135deg, #3B7CFF, #5A8DFF);
	box-shadow: 0 8rpx 24rpx rgba(59, 124, 255, 0.25);
	color: #fff;
	margin-bottom: 20rpx;
	box-sizing: border-box;
}

/* 半透明头像 */
.avatar {
	width: 112rpx;
	height: 112rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.22);
	border: 2rpx solid rgba(255, 255, 255, 0.6);
	color: #fff;
	font-size: 44rpx;
	font-weight: 600;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.name {
	font-size: 34rpx;
	font-weight: 600;
	color: #fff;
	margin-bottom: 8rpx;
}

.account {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.82);
	margin-bottom: 12rpx;
}

/* 半透明角色 tag */
.role-tag {
	margin-right: 0;
	background: rgba(255, 255, 255, 0.22);
	color: #fff;
}

.info {
	flex: 1;
	min-width: 0;
}

.card-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #1F2937;
	margin-bottom: 28rpx;
}

/* ===== 现代风格输入框：前缀图标 + 聚焦联动 ===== */
.field {
	display: flex;
	align-items: center;
	background: #F7F9FC;
	border: 2rpx solid #E5E9F0;
	border-radius: 14rpx;
	padding: 0 22rpx;
	height: 88rpx;
	margin-bottom: 22rpx;
	transition: all 0.18s ease;
}

.field-icon {
	font-size: 32rpx;
	margin-right: 16rpx;
	flex-shrink: 0;
	opacity: 0.7;
	transition: opacity 0.18s ease;
}

.field-input {
	flex: 1;
	height: 88rpx;
	font-size: 28rpx;
	color: #1F2937;
	background: transparent;
}

.field-suffix {
	font-size: 30rpx;
	padding: 10rpx;
	flex-shrink: 0;
}

/* 聚焦态：整行白底 + 蓝色描边 + 光晕 + 图标变亮 */
.field.focused {
	background: #ffffff;
	border-color: #3B7CFF;
	box-shadow: 0 0 0 5rpx rgba(59, 124, 255, 0.12);
}

.field.focused .field-icon {
	opacity: 1;
}

/* PC 悬停态 */
@media (min-width: 900px) {
	.field:hover {
		border-color: #9FBDFF;
		cursor: text;
	}

	.field-suffix:hover {
		cursor: pointer;
	}
}

.save-btn {
	margin-top: 10rpx;
	min-width: 240rpx;
}

/* 退出登录：通栏危险按钮 */
.logout {
	margin-top: 12rpx;
	height: 84rpx;
	line-height: 84rpx;
}

/* ===== 窄屏 ===== */
@media (max-width: 768px) {
	.save-btn {
		min-width: 0;
		width: 100%;
	}

	.user-card {
		padding: 32rpx 26rpx;
	}
}
</style>
