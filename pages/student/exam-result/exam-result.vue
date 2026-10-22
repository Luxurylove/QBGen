<template>
	<pc-layout :active="activeKey" title="成绩详情">
		<view class="result-wrap" v-if="detail">
			<!-- ===== 成绩摘要卡（居中） ===== -->
			<view class="card score-card"
				:class="detail.status === 'graded' ? (detail.total_score >= detail.pass_score ? 'is-pass' : 'is-fail') : 'is-pending'">
				<view class="exam-title">{{ detail.exam_title }}</view>

				<view class="big-score" v-if="detail.status === 'graded'">
					<text class="num">{{ detail.total_score }}</text>
					<text class="den">/ {{ detail.paper_total }} 分</text>
				</view>
				<text v-if="detail.status === 'graded'" class="verdict">
					{{ detail.total_score >= detail.pass_score ? '恭喜，已通过本次考试' : '很遗憾，未通过本次考试' }}
				</text>

				<view v-else class="pending">
					<text class="tag tag-orange"><text class="dot"></text>待阅卷</text>
					<view class="muted wait">客观题已得 {{ detail.objective_score }} 分，简答题等待教师评分</view>
				</view>

				<view v-if="detail.status === 'graded'" class="sub-scores">
					<view class="sub-item">
						<text class="sub-val">{{ detail.objective_score }}</text>
						<text class="sub-label">客观题</text>
					</view>
					<view class="sub-item">
						<text class="sub-val">{{ detail.subjective_score }}</text>
						<text class="sub-label">主观题</text>
					</view>
					<view class="sub-item">
						<text class="sub-val">{{ detail.pass_score }}</text>
						<text class="sub-label">及格线</text>
					</view>
				</view>

				<view v-if="detail.comment" class="comment">
					<text class="comment-label">教师评语</text>
					<text class="comment-text">{{ detail.comment }}</text>
				</view>
			</view>

			<!-- ===== 逐题回顾 ===== -->
			<view class="section-title q-list-title">逐题回顾</view>
			<view
				v-for="(item, i) in detail.questions"
				:key="item.question_id"
				class="card q-card"
				:class="detail.status === 'graded' ? (item.got_score >= item.score ? 'q-right' : 'q-wrong') : ''"
			>
				<view class="q-head">
					<view class="q-tags">
						<text class="tag tag-blue">{{ typeText[item.question && item.question.type] }}</text>
						<text class="tag tag-gray">{{ item.score }}分</text>
					</view>
					<text v-if="detail.status === 'graded'" :class="item.got_score >= item.score ? 'pass' : 'fail'">
						得分 {{ item.got_score }}
					</text>
				</view>
				<view class="stem">{{ i + 1 }}. {{ item.question ? item.question.stem : '题目已删除' }}</view>
				<template v-if="item.question">
					<view v-if="item.question.options && item.question.options.length" class="options">
						<text v-for="o in item.question.options" :key="o.key" class="muted option-line">{{ o.key }}. {{ o.text }}</text>
					</view>
					<view class="ua">我的答案：{{ fmtAnswer(item.user_answer) || '（未作答）' }}</view>
					<template v-if="detail.status === 'graded'">
						<view class="ra">参考答案：{{ fmtAnswer(item.question.answer) }}</view>
						<view v-if="item.question.analysis" class="muted ana">解析：{{ item.question.analysis }}</view>
					</template>
				</template>
			</view>
		</view>
	</pc-layout>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { call } from '@/common/request.js'
import { requireLogin } from '@/common/auth.js'

// 成绩详情高亮父级「我的成绩」菜单
const activeKey = '/pages/student/my-scores/my-scores'
const typeText = { single: '单选', multiple: '多选', judge: '判断', fill: '填空', essay: '简答' }
const detail = ref(null)

onLoad(async (query) => {
	if (!requireLogin()) return
	detail.value = await call('qb-answer', 'myResult', { record_id: query.record_id })
})

function fmtAnswer(a) {
	if (Array.isArray(a)) return a.join('、')
	return a
}
</script>

<style scoped>
/* 限宽容器：宽屏居中，保证阅读舒适度 */
.result-wrap {
	max-width: 980px;
	margin: 0 auto;
}

/* ===== 成绩摘要卡 ===== */
.score-card {
	position: relative;
	overflow: hidden;
	text-align: center;
	padding: 44rpx 28rpx 36rpx;
}

/* 顶部状态色带 */
.score-card::before {
	content: '';
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	height: 8rpx;
}

.is-pass::before {
	background: linear-gradient(90deg, #19A15F, #48C97F);
}

.is-fail::before {
	background: linear-gradient(90deg, #F56C6C, #FF9A9A);
}

.is-pending::before {
	background: linear-gradient(90deg, #FF8A3B, #FFB269);
}

.exam-title {
	font-weight: 600;
	font-size: 32rpx;
	color: #1F2937;
	margin-bottom: 24rpx;
	line-height: 1.4;
}

.big-score {
	display: flex;
	align-items: baseline;
	justify-content: center;
}

.big-score .num {
	font-size: 96rpx;
	font-weight: 700;
	line-height: 1;
	color: #19A15F;
}

.is-fail .big-score .num {
	color: #F56C6C;
}

.big-score .den {
	font-size: 26rpx;
	color: #909399;
	margin-left: 8rpx;
}

.verdict {
	display: block;
	font-size: 26rpx;
	color: #19A15F;
	margin-top: 14rpx;
}

.is-fail .verdict {
	color: #F56C6C;
}

/* 客观题 / 主观题 / 及格线 三分栏（竖分隔线） */
.sub-scores {
	display: flex;
	justify-content: center;
	margin-top: 32rpx;
	padding-top: 28rpx;
	border-top: 1rpx solid #F0F2F5;
}

.sub-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
}

.sub-item + .sub-item {
	border-left: 1rpx solid #F0F2F5;
}

.sub-val {
	font-size: 34rpx;
	font-weight: 600;
	color: #303133;
}

.sub-label {
	font-size: 22rpx;
	color: #909399;
}

.pending .wait {
	margin-top: 16rpx;
}

/* 教师评语块 */
.comment {
	margin-top: 28rpx;
	background: #F4F6FA;
	border-radius: 12rpx;
	padding: 22rpx 24rpx;
	text-align: left;
	display: flex;
	flex-direction: column;
	gap: 10rpx;
}

.comment-label {
	font-size: 22rpx;
	color: #909399;
}

.comment-text {
	font-size: 26rpx;
	color: #606266;
	line-height: 1.7;
}

/* ===== 逐题回顾：左侧 6rpx 对错色条 ===== */
.q-list-title {
	margin-top: 28rpx;
}

.q-card {
	position: relative;
	overflow: hidden;
	padding-left: 32rpx;
}

.q-card::before {
	content: '';
	position: absolute;
	left: 0;
	top: 0;
	bottom: 0;
	width: 6rpx;
}

.q-right::before {
	background: #19A15F;
}

.q-wrong::before {
	background: #F56C6C;
}

.q-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.q-tags {
	display: flex;
}

.stem {
	margin: 16rpx 0;
	line-height: 1.7;
	color: #1F2937;
}

.options {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
	margin-bottom: 12rpx;
}

.option-line {
	display: block;
	line-height: 1.7;
}

.ua {
	font-size: 26rpx;
	color: #606266;
	margin: 8rpx 0;
	line-height: 1.6;
}

.ra {
	font-size: 26rpx;
	color: #19A15F;
	margin: 8rpx 0;
	line-height: 1.6;
}

.ana {
	margin-top: 6rpx;
	line-height: 1.7;
}

.pass {
	color: #19A15F;
	font-weight: 600;
	font-size: 26rpx;
}

.fail {
	color: #F56C6C;
	font-weight: 600;
	font-size: 26rpx;
}

/* ===== 窄屏 ===== */
@media (max-width: 768px) {
	.score-card {
		padding: 36rpx 22rpx 30rpx;
	}

	.big-score .num {
		font-size: 84rpx;
	}
}
</style>
