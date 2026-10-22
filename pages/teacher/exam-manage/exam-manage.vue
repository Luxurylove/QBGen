<template>
	<pc-layout :active="activeKey" title="考试管理">
		<view class="page-bar">
			<text class="muted">共 {{ list.length }} 场考试</text>
			<view class="page-bar-ops">
				<button class="btn-primary" @click="openForm()">发布考试</button>
			</view>
		</view>

		<!-- 考试表格 -->
		<view v-if="!list.length" class="card table-card">
			<view class="empty-tip">暂无考试，点击右上角发布</view>
		</view>
		<view v-else class="card table-card">
			<view class="tbl-scroll">
				<view class="vtable exam-cols">
					<view class="vhead exam-cols">
						<view class="vth">考试名称</view>
						<view class="vth">试卷</view>
						<view class="vth">考试时间</view>
						<view class="vth">状态</view>
						<view class="vth">已交卷</view>
						<view class="vth col-ops">操作</view>
					</view>
					<view class="vrow exam-cols" v-for="e in list" :key="e._id">
						<view class="vtd">
							<view class="cell-wrap">
								<view class="cell-main cell-clamp">{{ e.title }}</view>
							</view>
						</view>
						<view class="vtd">
							<view class="cell-wrap">
								<view class="cell-main cell-clamp">{{ e.paper_title }}</view>
								<view class="cell-sub">{{ e.total_score }} 分 · {{ e.duration }} 分钟</view>
							</view>
						</view>
						<view class="vtd">
							<view class="cell-wrap">
								<view class="time-line">{{ fmtTime(e.start_time) }}</view>
								<view class="time-line">~ {{ fmtTime(e.end_time) }}</view>
							</view>
						</view>
						<view class="vtd">
							<text :class="['tag', e.status === 'published' ? 'tag-green' : 'tag-gray']">
								<text class="dot"></text>{{ e.status === 'published' ? '开放中' : '已关闭' }}
							</text>
						</view>
						<view class="vtd">{{ e.submit_count }} 人</view>
						<view class="vtd col-ops">
							<text class="op-link op-edit" @click="toggleStatus(e)">{{ e.status === 'published' ? '关闭' : '开启' }}</text>
							<text class="op-link op-del" @click="removeExam(e)">删除</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- ===== 发布考试弹层 ===== -->
		<view v-if="showForm" class="mask" @click="showForm = false">
			<view class="panel" @click.stop>
				<view class="panel-title">发布考试</view>

				<view class="form-item">
					<text class="form-label"><text class="req">*</text>考试名称</text>
					<input class="form-input" v-model="form.title" placeholder="如：期中综合测试" />
				</view>

				<view class="form-item">
					<text class="form-label"><text class="req">*</text>选择试卷</text>
					<picker :range="papers" range-key="title" @change="e => form.paper_id = papers[e.detail.value]._id">
						<view class="picker-box">{{ paperName || '请选择试卷' }}</view>
					</picker>
				</view>

				<view class="form-item">
					<text class="form-label">开始时间</text>
					<view class="time-row">
						<picker mode="date" class="time-pick" @change="e => form.startDate = e.detail.value">
							<view class="picker-box">{{ form.startDate || '日期' }}</view>
						</picker>
						<picker mode="time" class="time-pick" @change="e => form.startTime = e.detail.value">
							<view class="picker-box">{{ form.startTime || '时刻' }}</view>
						</picker>
					</view>
				</view>

				<view class="form-item">
					<text class="form-label">结束时间</text>
					<view class="time-row">
						<picker mode="date" class="time-pick" @change="e => form.endDate = e.detail.value">
							<view class="picker-box">{{ form.endDate || '日期' }}</view>
						</picker>
						<picker mode="time" class="time-pick" @change="e => form.endTime = e.detail.value">
							<view class="picker-box">{{ form.endTime || '时刻' }}</view>
						</picker>
					</view>
				</view>

				<view class="panel-btns">
					<button class="btn-plain" @click="showForm = false">取消</button>
					<button class="btn-primary" @click="save">发布</button>
				</view>
			</view>
		</view>
	</pc-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { call } from '@/common/request.js'
import { requireLogin } from '@/common/auth.js'

const activeKey = '/pages/teacher/exam-manage/exam-manage'

const list = ref([])
const papers = ref([])
const showForm = ref(false)
const form = ref({})

const paperName = computed(() => {
	const p = papers.value.find(x => x._id === form.value.paper_id)
	return p ? p.title : ''
})

onShow(async () => {
	if (!requireLogin()) return
	load()
})

async function load() {
	list.value = await call('qb-exam', 'list')
}

async function openForm() {
	papers.value = await call('qb-paper', 'list')
	if (!papers.value.length) {
		uni.showToast({ title: '请先创建试卷', icon: 'none' })
		return
	}
	const now = new Date()
	const pad = n => String(n).padStart(2, '0')
	const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
	form.value = {
		title: '', paper_id: '',
		startDate: today, startTime: '00:00',
		endDate: today, endTime: '23:59'
	}
	showForm.value = true
}

async function save() {
	if (!form.value.title.trim()) {
		uni.showToast({ title: '请输入考试名称', icon: 'none' })
		return
	}
	if (!form.value.paper_id) {
		uni.showToast({ title: '请选择试卷', icon: 'none' })
		return
	}
	await call('qb-exam', 'create', {
		title: form.value.title,
		paper_id: form.value.paper_id,
		start_time: `${form.value.startDate} ${form.value.startTime}:00`,
		end_time: `${form.value.endDate} ${form.value.endTime}:00`
	})
	uni.showToast({ title: '已发布', icon: 'success' })
	showForm.value = false
	load()
}

async function toggleStatus(e) {
	await call('qb-exam', 'update', {
		_id: e._id,
		status: e.status === 'published' ? 'closed' : 'published'
	})
	load()
}

function removeExam(e) {
	uni.showModal({
		title: '确认删除',
		content: `确定删除考试「${e.title}」吗？`,
		success: async (res) => {
			if (!res.confirm) return
			await call('qb-exam', 'remove', { _id: e._id })
			uni.showToast({ title: '已删除', icon: 'success' })
			load()
		}
	})
}

function fmtTime(t) {
	const d = new Date(t)
	const pad = n => String(n).padStart(2, '0')
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style scoped>
/* 表格列模板 */
.exam-cols {
	grid-template-columns: minmax(0, 2fr) minmax(0, 2fr) minmax(0, 2.4fr) 1fr 0.9fr 1.2fr;
	min-width: 900px;
}

.cell-wrap {
	min-width: 0;
	width: 100%;
}

.cell-clamp {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.time-line {
	font-size: 23rpx;
	color: #606266;
	line-height: 1.6;
	white-space: nowrap;
}

/* ===== 弹层 ===== */
.mask {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 300;
}

.panel {
	background: #fff;
	border-radius: 20rpx;
	width: 640rpx;
	max-width: 92vw;
	padding: 34rpx 36rpx;
	box-shadow: 0 24rpx 70rpx rgba(0, 0, 0, 0.22);
	box-sizing: border-box;
}

.panel-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #1F2937;
	margin-bottom: 22rpx;
}

.picker-box {
	background: #F4F6FA;
	border-radius: 10rpx;
	padding: 16rpx 20rpx;
	font-size: 28rpx;
	color: #303133;
}

/* 日期 + 时刻并排 */
.time-row {
	display: flex;
	gap: 16rpx;
}

.time-pick {
	flex: 1;
	min-width: 0;
}

/* 底部按钮并排 */
.panel-btns {
	display: flex;
	gap: 20rpx;
	margin-top: 28rpx;
}

.panel-btns button {
	flex: 1;
}

/* 窄屏：表格由 tbl-scroll 横滚；弹层按 92vw 自适应 */
@media (max-width: 768px) {
	.panel {
		padding: 28rpx 24rpx;
	}
}
</style>
