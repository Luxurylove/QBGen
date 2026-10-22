<template>
	<pc-layout :active="activeKey" title="用户管理">
		<view class="page-bar">
			<text class="muted">共 {{ list.length }} 个用户</text>
			<button class="btn-primary btn-sm" @click="openForm()">新增用户</button>
		</view>

		<view v-if="list.length === 0" class="card empty-card">
			<view class="empty-icon">👥</view>
			<view class="empty-text">暂无用户，点击右上角「新增用户」创建</view>
		</view>

		<view v-else class="card table-card">
			<view class="tbl-scroll">
				<view class="vtable user-cols">
					<view class="vhead user-cols">
						<view class="vth">姓名</view>
						<view class="vth">账号</view>
						<view class="vth">角色</view>
						<view class="vth">注册时间</view>
						<view class="vth col-ops">操作</view>
					</view>
					<view class="vrow user-cols" v-for="u in list" :key="u._id">
						<view class="vtd">
							<text class="cell-main">{{ u.name }}</text>
						</view>
						<view class="vtd">
							<text class="cell-sub">{{ u.username }}</text>
						</view>
						<view class="vtd">
							<text :class="['tag', roleTag[u.role]]">{{ roleText[u.role] }}</text>
						</view>
						<view class="vtd">{{ fmtTime(u.created_at) }}</view>
						<view class="vtd col-ops">
							<text class="op-link op-edit" @click="openForm(u)">编辑</text>
							<text class="op-link op-del" @click="removeUser(u)">删除</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 新增/编辑弹层 -->
			<view v-if="showForm" class="mask" @click="showForm = false">
				<view class="panel" @click.stop>
					<view class="panel-title">{{ form._id ? '编辑用户' : '新增用户' }}</view>

					<!-- 用户名 -->
					<view class="field" :class="{ focused: focusUsername, disabled: !!form._id }">
						<text class="field-icon">👤</text>
						<input
							class="field-input"
							v-model="form.username"
							:disabled="!!form._id"
							placeholder="登录账号"
							@focus="focusUsername = true"
							@blur="focusUsername = false"
						/>
					</view>

					<!-- 姓名 -->
					<view class="field" :class="{ focused: focusName }">
						<text class="field-icon">📛</text>
						<input
							class="field-input"
							v-model="form.name"
							placeholder="真实姓名"
							@focus="focusName = true"
							@blur="focusName = false"
						/>
					</view>

					<!-- 密码 -->
					<view class="field" :class="{ focused: focusPwd }">
						<text class="field-icon">🔒</text>
						<input
							class="field-input"
							v-model="form.password"
							:password="!showPwd"
							:placeholder="form._id ? '留空不修改' : '登录密码'"
							@focus="focusPwd = true"
							@blur="focusPwd = false"
						/>
						<text v-if="form.password" class="field-suffix" @click="showPwd = !showPwd">
							{{ showPwd ? '🙈' : '👁️' }}
						</text>
					</view>

					<!-- 角色 -->
					<view class="field" :class="{ focused: focusRole }">
						<text class="field-icon">🎭</text>
						<picker
							class="field-input picker-field"
							:range="roleOptions"
							@change="onRoleChange"
						>
							<view class="picker-inner">{{ roleText[form.role] }}</view>
						</picker>
						<text class="field-suffix arrow">▾</text>
					</view>

					<view class="panel-btns">
						<button class="btn-plain" @click="showForm = false">取消</button>
						<button class="btn-primary" @click="save">保存</button>
					</view>
				</view>
			</view>
	</pc-layout>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { call } from '@/common/request.js'
import { requireLogin, ROLE_TEXT } from '@/common/auth.js'

const activeKey = '/pages/admin/users/users'
const roleText = ROLE_TEXT
const roleTag = { student: 'tag-blue', teacher: 'tag-green', admin: 'tag-red' }
const roleOptions = ['学生', '教师', '管理员']
const roleValues = ['student', 'teacher', 'admin']

const list = ref([])
const showForm = ref(false)
const form = ref({})

// 输入框聚焦态与密码可见性
const focusUsername = ref(false)
const focusName = ref(false)
const focusPwd = ref(false)
const focusRole = ref(false)
const showPwd = ref(false)

onShow(async () => {
	if (!requireLogin()) return
	load()
})

async function load() {
	list.value = await call('qb-user', 'list')
}

function openForm(u) {
	form.value = u
		? { _id: u._id, username: u.username, name: u.name, role: u.role, password: '' }
		: { username: '', name: '', role: 'student', password: '' }
	focusUsername.value = focusName.value = focusPwd.value = focusRole.value = false
	showPwd.value = false
	showForm.value = true
}

function onRoleChange(e) {
	form.value.role = roleValues[e.detail.value]
}

async function save() {
	if (!form.value._id) {
		await call('qb-user', 'create', form.value)
	} else {
		await call('qb-user', 'update', form.value)
	}
	uni.showToast({ title: '已保存', icon: 'success' })
	showForm.value = false
	load()
}

function removeUser(u) {
	uni.showModal({
		title: '确认删除',
		content: `确定删除用户「${u.name}（${u.username}）」吗？`,
		success: async (res) => {
			if (!res.confirm) return
			await call('qb-user', 'remove', { _id: u._id })
			uni.showToast({ title: '已删除', icon: 'success' })
			load()
		}
	})
}

function fmtTime(t) {
	if (!t) return '-'
	const d = new Date(t)
	return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}
</script>

<style scoped>
/* 表格列模板：vhead/vrow 共用，保证列宽一致；窄屏横向滚动 */
.user-cols {
	grid-template-columns: 1.5fr 1.5fr 1fr 1.3fr 1fr;
	min-width: 720px;
}

/* 空状态 */
.empty-card {
	text-align: center;
	padding: 80rpx 0;
}

.empty-icon {
	font-size: 80rpx;
	line-height: 1;
}

.empty-text {
	color: #909399;
	font-size: 26rpx;
	margin-top: 20rpx;
}

/* 禁用态输入框 */
.form-input[disabled] {
	background: #F4F6FA;
	color: #909399;
}

/* ===== 新增/编辑弹层 ===== */
.mask {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.45);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 300;
	padding: 32rpx;
	box-sizing: border-box;
}

.panel {
	width: 600rpx;
	max-width: 92vw;
	background: #fff;
	border-radius: 20rpx;
	padding: 32rpx;
	box-shadow: 0 24rpx 80rpx rgba(15, 30, 60, 0.22);
	box-sizing: border-box;
}

.panel-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #1F2937;
	margin-bottom: 24rpx;
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
	min-width: 0;
}

.field-suffix {
	font-size: 30rpx;
	padding: 10rpx;
	flex-shrink: 0;
}

.field-suffix.arrow {
	opacity: 0.55;
	font-size: 24rpx;
}

/* picker 内部 */
.picker-field {
	display: flex;
	align-items: center;
}

.picker-inner {
	width: 100%;
}

/* 聚焦态 */
.field.focused {
	background: #ffffff;
	border-color: #3B7CFF;
	box-shadow: 0 0 0 5rpx rgba(59, 124, 255, 0.12);
}

.field.focused .field-icon {
	opacity: 1;
}

/* 禁用态（编辑用户名） */
.field.disabled {
	background: #F4F6FA;
	opacity: 0.85;
}

.field.disabled .field-input {
	color: #909399;
}

/* PC 悬停 */
@media (min-width: 900px) {
	.field:hover {
		border-color: #9FBDFF;
		cursor: text;
	}

	.field.disabled:hover {
		border-color: #E5E9F0;
		cursor: not-allowed;
	}

	.field-suffix:hover {
		cursor: pointer;
	}
}

.panel-btns {
	display: flex;
	gap: 20rpx;
	margin-top: 28rpx;
}

.panel-btns button {
	flex: 1;
}
</style>
