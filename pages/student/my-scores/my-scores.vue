<template>
	<pc-layout :active="activeKey" title="我的成绩">
		<view class="page-bar">
			<text class="muted">共 {{ list.length }} 条考试记录</text>
		</view>

		<view v-if="list.length === 0" class="card empty-card">
			<view class="empty-icon">📭</view>
			<view class="empty-text">还没有考试记录，先去参加考试吧</view>
		</view>

		<view v-else class="card table-card">
			<view class="tbl-scroll">
				<view class="vtable score-cols">
					<view class="vhead score-cols">
						<view class="vth">考试名称</view>
						<view class="vth">交卷时间</view>
						<view class="vth">状态</view>
						<view class="vth">分数</view>
						<view class="vth col-ops">操作</view>
					</view>
					<view
						class="vrow score-cols"
						v-for="r in list"
						:key="r._id"
						@click="goDetail(r)"
					>
						<view class="vtd">
							<view>
								<view class="cell-main">{{ r.exam_title }}</view>
								<view class="cell-sub">{{ r.paper_title }}</view>
							</view>
						</view>
						<view class="vtd">{{ fmt(r.submit_time) }}</view>
						<view class="vtd">
							<text v-if="r.status === 'graded'" class="tag tag-green"><text class="dot"></text>已出分</text>
							<text v-else class="tag tag-orange"><text class="dot"></text>待阅卷</text>
						</view>
						<view class="vtd">
							<view
								v-if="r.status === 'graded'"
								class="score-cell"
								:class="r.total_score >= r.pass_score ? 'sc-pass' : 'sc-fail'"
							>
								<text class="score-num">{{ r.total_score }}</text>
								<text class="score-total">/{{ r.paper_total }}</text>
							</view>
							<text v-else class="tag tag-orange">待阅卷</text>
						</view>
						<view class="vtd col-ops">
							<text class="op-link op-view" @click.stop="goDetail(r)">查看</text>
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

const activeKey = '/pages/student/my-scores/my-scores'
const list = ref([])

onShow(async () => {
	if (!requireLogin()) return
	list.value = await call('qb-answer', 'myRecords')
})

function fmt(t) {
	const d = new Date(t)
	const p = (n) => String(n).padStart(2, '0')
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function goDetail(r) {
	uni.navigateTo({ url: '/pages/student/exam-result/exam-result?record_id=' + r._id })
}
</script>

<style scoped>
/* 表格列模板：vhead 与 vrow 共用，min-width 供窄屏横向滚动 */
.score-cols {
	grid-template-columns: 2.4fr 1.7fr 1fr 1.2fr 0.8fr;
	min-width: 760px;
}

@media (min-width: 769px) {
	.vrow.score-cols {
		cursor: pointer;
	}
}

/* 分数单元格：大号数字，及格绿 / 不及格红 */
.score-cell {
	display: flex;
	align-items: baseline;
}

.score-num {
	font-size: 44rpx;
	font-weight: 700;
	line-height: 1;
}

.sc-pass .score-num {
	color: #19A15F;
}

.sc-fail .score-num {
	color: #F56C6C;
}

.score-total {
	font-size: 22rpx;
	color: #909399;
	margin-left: 4rpx;
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
</style>
