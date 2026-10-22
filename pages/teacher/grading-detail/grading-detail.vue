<template>
	<pc-layout :active="activeKey" title="答卷批阅">
		<view class="detail-wrap" v-if="detail">
			<!-- ===== 顶部：答卷信息卡 ===== -->
			<view class="card">
				<view class="section-title">答卷信息</view>
				<view class="info-grid">
					<view class="info-cell">
						<text class="info-label">学生</text>
						<text class="info-value">{{ detail.student_name }}（{{ detail.student_username }}）</text>
					</view>
					<view class="info-cell">
						<text class="info-label">考试 / 试卷</text>
						<text class="info-value">{{ detail.exam_title }} · {{ detail.paper_title }}</text>
					</view>
					<view class="info-cell">
						<text class="info-label">客观题得分</text>
						<text class="info-value score-text">{{ detail.objective_score }} 分</text>
					</view>
					<view class="info-cell">
						<text class="info-label">状态</text>
						<text :class="['tag', detail.status === 'graded' ? 'tag-green' : 'tag-orange']">
							{{ detail.status === 'graded' ? '已出分' : '待阅卷' }}
						</text>
					</view>
				</view>
			</view>

			<!-- ===== 逐题查看与打分 ===== -->
			<view v-for="(item, i) in detail.questions" :key="item.question_id" class="card">
				<view class="q-head">
					<view class="q-tags">
						<text class="tag tag-blue">{{ typeText[item.question && item.question.type] }}</text>
						<text class="tag tag-gray">{{ item.score }} 分</text>
					</view>
					<text class="muted">当前得分 {{ item.got_score }}</text>
				</view>

				<view class="q-stem">{{ i + 1 }}. {{ item.question ? item.question.stem : '题目已删除' }}</view>

				<template v-if="item.question">
					<view v-if="item.question.options && item.question.options.length" class="q-options">
						<text v-for="o in item.question.options" :key="o.key" class="option-line">{{ o.key }}. {{ o.text }}</text>
					</view>

					<view class="answer-block ua-block">
						<text class="ab-label">学生答案</text>
						<text class="ab-text">{{ fmtAnswer(item.user_answer) || '（未作答）' }}</text>
					</view>
					<view class="answer-block ra-block">
						<text class="ab-label">参考答案</text>
						<text class="ab-text">{{ fmtAnswer(item.question.answer) }}</text>
					</view>
					<view v-if="item.question.analysis" class="answer-block an-block">
						<text class="ab-label">解析</text>
						<text class="ab-text">{{ item.question.analysis }}</text>
					</view>

					<!-- 简答题打分：暖色底，label + 数字输入（校验 0-满分 在提交时执行） -->
					<view v-if="item.question.type === 'essay'" class="grade-row">
						<text class="grade-label">本题打分</text>
						<text class="grade-max">满分 {{ item.score }} 分</text>
						<input class="score-input" type="digit" v-model="scores[item.question_id]" :placeholder="String(item.got_score)" />
						<text class="grade-tip">分数须在 0 ~ {{ item.score }} 之间</text>
					</view>
				</template>
			</view>

			<!-- ===== 底部：评语与提交 ===== -->
			<view class="card">
				<view class="form-item">
					<text class="form-label">教师评语</text>
					<textarea class="form-textarea" v-model="comment" placeholder="可填写评语（选填）" :maxlength="-1" />
				</view>
				<view class="submit-foot">
					<button class="btn-primary submit-btn" :disabled="submitting" @click="submitGrade">
						{{ submitting ? '提交中...' : '提交评分' }}
					</button>
				</view>
			</view>
		</view>
	</pc-layout>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { call } from '@/common/request.js'
import { requireLogin } from '@/common/auth.js'

// 子页面：高亮父级「在线阅卷」菜单
const activeKey = '/pages/teacher/grading-list/grading-list'

const typeText = { single: '单选', multiple: '多选', judge: '判断', fill: '填空', essay: '简答' }
const detail = ref(null)
const scores = ref({})
const comment = ref('')
const submitting = ref(false)
let recordId = ''

onLoad(async (query) => {
	if (!requireLogin()) return
	recordId = query.record_id
	detail.value = await call('qb-grading', 'detail', { record_id: recordId })
	comment.value = detail.value.comment || ''
	// 简答题分数初始化为当前得分
	detail.value.questions.forEach(item => {
		if (item.question && item.question.type === 'essay') {
			scores.value[item.question_id] = String(item.got_score)
		}
	})
})

function fmtAnswer(a) {
	if (Array.isArray(a)) return a.join('、')
	return a
}

async function submitGrade() {
	// 校验所有简答题已打分且不超过满分
	for (const item of detail.value.questions) {
		if (item.question && item.question.type === 'essay') {
			const v = scores.value[item.question_id]
			if (v === '' || v === undefined) {
				uni.showToast({ title: `第 ${detail.value.questions.indexOf(item) + 1} 题未打分`, icon: 'none' })
				return
			}
			const n = Number(v)
			if (isNaN(n) || n < 0 || n > item.score) {
				uni.showToast({ title: `第 ${detail.value.questions.indexOf(item) + 1} 题分数应在 0-${item.score} 之间`, icon: 'none' })
				return
			}
		}
	}
	submitting.value = true
	try {
		const res = await call('qb-grading', 'grade', {
			record_id: recordId,
			scores: scores.value,
			comment: comment.value
		})
		uni.showToast({ title: `已出分：${res.total_score} 分`, icon: 'none' })
		setTimeout(() => uni.navigateBack(), 800)
	} finally {
		submitting.value = false
	}
}
</script>

<style scoped>
/* 内容限宽，便于阅读 */
.detail-wrap {
	max-width: 960px;
}

/* ===== 信息卡：宽屏四列，窄屏两列 ===== */
.info-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 20rpx 28rpx;
}

@media (min-width: 900px) {
	.info-grid {
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}
}

.info-cell {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	min-width: 0;
}

.info-label {
	font-size: 22rpx;
	color: #909399;
}

.info-value {
	font-size: 27rpx;
	color: #1F2937;
	font-weight: 500;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.score-text {
	color: #3B7CFF;
	font-weight: 700;
	font-size: 30rpx;
}

/* ===== 逐题卡 ===== */
.q-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16rpx;
	margin-bottom: 16rpx;
}

.q-tags {
	display: flex;
	flex-wrap: wrap;
}

.q-stem {
	font-size: 29rpx;
	line-height: 1.8;
	color: #1F2937;
	margin-bottom: 16rpx;
}

.q-options {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	margin-bottom: 16rpx;
}

.option-line {
	font-size: 25rpx;
	color: #606266;
	line-height: 1.6;
}

/* 学生答案 / 参考答案 / 解析：小块呈现 */
.answer-block {
	display: flex;
	align-items: flex-start;
	gap: 16rpx;
	border-radius: 10rpx;
	padding: 14rpx 18rpx;
	margin-bottom: 10rpx;
	font-size: 26rpx;
	line-height: 1.6;
}

.ab-label {
	flex-shrink: 0;
	font-size: 23rpx;
	padding: 2rpx 12rpx;
	border-radius: 6rpx;
}

.ab-text {
	min-width: 0;
	flex: 1;
	word-break: break-all;
}

.ua-block {
	background: #F4F6FA;
}

.ua-block .ab-label {
	background: #E2E6ED;
	color: #606266;
}

.ua-block .ab-text {
	color: #303133;
}

.ra-block {
	background: #EFF9F3;
}

.ra-block .ab-label {
	background: #D5F0E0;
	color: #19A15F;
}

.ra-block .ab-text {
	color: #157A47;
}

.an-block {
	background: #F7F8FA;
}

.an-block .ab-label {
	background: #E8EBF0;
	color: #909399;
}

.an-block .ab-text {
	color: #606266;
}

/* 简答题打分行：暖色底 */
.grade-row {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 14rpx;
	background: #FFF3E0;
	border: 1rpx solid #FFE0B2;
	border-radius: 10rpx;
	padding: 18rpx 20rpx;
}

.grade-label {
	font-size: 26rpx;
	font-weight: 600;
	color: #B26A00;
}

.grade-max {
	font-size: 24rpx;
	color: #B26A00;
}

.score-input {
	width: 140rpx;
	background: #fff;
	border: 1rpx solid #EBC892;
	border-radius: 8rpx;
	padding: 10rpx 16rpx;
	font-size: 28rpx;
	text-align: center;
}

.grade-tip {
	font-size: 22rpx;
	color: #C19050;
}

/* ===== 底部提交 ===== */
.submit-foot {
	display: flex;
	justify-content: flex-end;
}

.submit-btn {
	min-width: 280rpx;
}

/* 窄屏：信息卡堆叠为单列；提交按钮占满 */
@media (max-width: 768px) {
	.info-grid {
		grid-template-columns: 1fr;
	}

	.submit-foot {
		justify-content: stretch;
	}

	.submit-btn {
		width: 100%;
	}
}
</style>
