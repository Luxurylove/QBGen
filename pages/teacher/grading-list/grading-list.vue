<template>
	<pc-layout :active="activeKey" title="在线阅卷">
		<!-- 筛选卡：考试 picker + 状态分段 -->
		<view class="card">
			<view class="filter-bar">
				<view class="field exam-field">
					<text class="field-label">考试</text>
					<picker :range="examOptions" range-key="title" @change="onExamChange">
						<view class="filter-select picker-wide">
							{{ examIndex >= 0 ? examOptions[examIndex].title : '全部考试' }}
						</view>
					</picker>
				</view>
				<view class="field">
					<text class="field-label">状态</text>
					<view class="seg">
						<text
							v-for="t in statusTabs"
							:key="t.value"
							class="seg-item"
							:class="{ active: statusFilter === t.value }"
							@click="setStatus(t.value)"
						>{{ t.label }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 答卷表格 -->
		<view v-if="!list.length" class="card table-card">
			<view class="empty-tip">暂无答卷记录</view>
		</view>
		<view v-else class="card table-card">
			<view class="tbl-scroll">
				<view class="vtable grade-cols">
					<view class="vhead grade-cols">
						<view class="vth">学生姓名</view>
						<view class="vth">考试 / 试卷</view>
						<view class="vth">状态</view>
						<view class="vth">得分</view>
						<view class="vth">交卷时间</view>
						<view class="vth col-ops">操作</view>
					</view>
					<view class="vrow grade-cols" v-for="r in list" :key="r._id">
						<view class="vtd">
							<text class="cell-main">{{ r.student_name }}</text>
						</view>
						<view class="vtd">
							<view class="cell-wrap">
								<view class="cell-main cell-clamp">{{ r.exam_title }}</view>
								<view class="cell-sub cell-clamp">{{ r.paper_title }}</view>
							</view>
						</view>
						<view class="vtd">
							<text :class="['tag', r.status === 'graded' ? 'tag-green' : 'tag-orange']">
								{{ r.status === 'graded' ? '已出分' : '待阅卷' }}
							</text>
						</view>
						<view class="vtd">
							<view v-if="r.status === 'graded'" class="score-big">{{ r.total_score }}<text class="score-unit"> / {{ r.paper_total }}</text></view>
							<text v-else class="muted">客观题 {{ r.objective_score }} 分</text>
						</view>
						<view class="vtd">
							<text class="time-text">{{ fmtTime(r.submit_time) }}</text>
						</view>
						<view class="vtd col-ops">
							<text class="op-link op-view" @click="goDetail(r)">{{ r.status === 'graded' ? '查看' : '阅卷' }}</text>
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
import { requireLogin } from '@/common/auth.js'

const activeKey = '/pages/teacher/grading-list/grading-list'

// 纯展示：状态分段配置
const statusTabs = [
	{ label: '待阅卷', value: 'submitted' },
	{ label: '已出分', value: 'graded' },
	{ label: '全部', value: '' }
]

const list = ref([])
const exams = ref([])
const examOptions = ref([])
const examIndex = ref(-1)
const statusFilter = ref('submitted')

onShow(async () => {
	if (!requireLogin()) return
	exams.value = await call('qb-exam', 'list')
	examOptions.value = exams.value
	await load()
})

async function load() {
	const params = {}
	if (examIndex.value >= 0) params.exam_id = examOptions.value[examIndex.value]._id
	if (statusFilter.value) params.status = statusFilter.value
	list.value = await call('qb-grading', 'list', params)
}

async function onExamChange(e) {
	examIndex.value = Number(e.detail.value)
	await load()
}

async function setStatus(s) {
	statusFilter.value = s
	await load()
}

function goDetail(r) {
	uni.navigateTo({ url: `/pages/teacher/grading-detail/grading-detail?record_id=${r._id}` })
}

function fmtTime(t) {
	const d = new Date(t)
	return `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
/* 表格列模板 */
.grade-cols {
	grid-template-columns: minmax(0, 1.4fr) minmax(0, 2.4fr) 1fr minmax(0, 1.6fr) 1.2fr 1fr;
	min-width: 880px;
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

/* 考试 picker 宽一些 */
.exam-field {
	flex: 1 1 360rpx;
	min-width: 0;
}

.picker-wide {
	min-width: 280rpx;
}

/* 分段选择 */
.seg {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}

.seg-item {
	background: #F0F2F5;
	border-radius: 8rpx;
	padding: 10rpx 26rpx;
	font-size: 25rpx;
	color: #606266;
	cursor: pointer;
}

.seg-item.active {
	background: #3B7CFF;
	color: #fff;
}

/* 已出分：总分大号 */
.score-big {
	font-size: 36rpx;
	font-weight: 700;
	color: #3B7CFF;
	line-height: 1.2;
	font-variant-numeric: tabular-nums;
}

.score-unit {
	font-size: 22rpx;
	font-weight: 400;
	color: #909399;
}

.time-text {
	font-size: 24rpx;
	color: #606266;
	white-space: nowrap;
}

/* 窄屏：筛选 wrap；表格横滚 */
@media (max-width: 768px) {
	.exam-field {
		flex: 1 1 100%;
	}
}
</style>
