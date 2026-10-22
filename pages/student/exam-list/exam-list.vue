<template>
	<pc-layout :active="activeKey" title="参加考试">
		<view class="page-bar">
			<text class="muted">共 {{ list.length }} 场考试</text>
		</view>

		<view v-if="list.length === 0" class="card empty-card">
			<view class="empty-icon">📭</view>
			<view class="empty-text">暂无考试安排</view>
		</view>

		<view v-else class="card table-card">
			<view class="tbl-scroll">
				<view class="vtable exam-cols">
					<view class="vhead exam-cols">
						<view class="vth">考试名称</view>
						<view class="vth">题量 / 总分</view>
						<view class="vth">时长</view>
						<view class="vth">状态</view>
						<view class="vth">我的情况</view>
						<view class="vth col-ops">操作</view>
					</view>
					<view class="vrow exam-cols" v-for="e in list" :key="e._id">
						<view class="vtd">
							<view>
								<view class="cell-main">{{ e.title }}</view>
								<view class="cell-sub">{{ fmt(e.start_time) }} ~ {{ fmt(e.end_time) }}</view>
							</view>
						</view>
						<view class="vtd">{{ e.question_count }} 题 / {{ e.total_score }} 分</view>
						<view class="vtd">{{ e.duration }} 分钟</view>
						<view class="vtd">
							<text v-if="e.phase === 'ongoing'" class="tag tag-green"><text class="dot"></text>进行中</text>
							<text v-else-if="e.phase === 'notStarted'" class="tag tag-orange"><text class="dot"></text>未开始</text>
							<text v-else class="tag tag-gray"><text class="dot"></text>已结束</text>
						</view>
						<view class="vtd">
							<text v-if="e.my_status === 'graded'" class="text-primary fw-600">{{ e.my_score }} 分</text>
							<text v-else-if="e.my_status === 'submitted'" class="tag tag-orange">待阅卷</text>
							<text v-else class="muted">未参加</text>
						</view>
						<view class="vtd col-ops">
							<button v-if="!e.my_status && e.phase === 'ongoing'" class="btn-primary btn-sm" @click="onEnter(e)">进入考试</button>
							<text v-if="e.my_status" class="op-link op-view" @click="onView(e)">查看成绩</text>
							<text v-if="!e.my_status && e.phase !== 'ongoing'" class="muted">—</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</pc-layout>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { call } from '@/common/request.js'
import { getUser, requireLogin } from '@/common/auth.js'

const activeKey = '/pages/student/exam-list/exam-list'
const list = ref([])

onShow(async () => {
	if (!requireLogin()) return
	if (getUser().role !== 'student') return
	list.value = await call('qb-exam', 'listForStudent')
})

function fmt(t) {
	const d = new Date(t)
	const p = (n) => String(n).padStart(2, '0')
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function onEnter(e) {
	uni.showModal({
		title: '进入考试',
		content: `考试时长 ${e.duration} 分钟，进入后请一次性完成作答，确定开始吗？`,
		success: (r) => {
			if (r.confirm) {
				uni.navigateTo({ url: '/pages/student/take-exam/take-exam?exam_id=' + e._id })
			}
		}
	})
}

async function onView(e) {
	const records = await call('qb-answer', 'myRecords')
	const rec = records.find(r => r.exam_id === e._id)
	if (rec) {
		uni.navigateTo({ url: '/pages/student/exam-result/exam-result?record_id=' + rec._id })
	}
}
</script>

<style scoped>
/* 表格列模板：vhead 与 vrow 共用，保证列宽一致；最小宽度用于窄屏横向滚动 */
.exam-cols {
	grid-template-columns: 2.2fr 1.5fr 0.8fr 1fr 1fr 1.2fr;
	min-width: 820px;
}

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
</style>
