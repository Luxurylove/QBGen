<template>
	<pc-layout :active="activeKey" title="在线答题">
		<view class="exam-wrap">
			<!-- ===== 左：答题卡导航 ===== -->
			<view class="q-nav">
				<view class="section-title">答题卡</view>
				<scroll-view scroll-x class="nav-scroll">
					<view class="nav-grid">
						<text
							v-for="(q, i) in paper.questions"
							:key="q.question_id"
							class="nav-cell"
							:class="{ answered: isAnswered(q), current: i === current }"
							@click="current = i"
						>{{ i + 1 }}</text>
					</view>
				</scroll-view>
				<view class="nav-legend">
					<view class="lg-item"><text class="lg-box lg-current"></text>当前</view>
					<view class="lg-item"><text class="lg-box lg-answered"></text>已答</view>
					<view class="lg-item"><text class="lg-box lg-unanswered"></text>未答</view>
				</view>
			</view>

			<!-- ===== 中：当前题目 ===== -->
			<view class="q-main">
				<view class="card" v-if="cur">
					<view class="q-head">
						<view class="q-tags">
							<text class="tag tag-blue">{{ typeText[cur.question.type] }}</text>
							<text class="tag tag-gray">{{ cur.score }} 分</text>
						</view>
						<text class="muted">第 {{ current + 1 }} / {{ paper.questions.length }} 题</text>
					</view>

					<view class="stem">{{ cur.question.stem }}</view>

					<!-- 单选 / 判断 -->
					<view v-if="cur.question.type === 'single' || cur.question.type === 'judge'">
						<view
							v-for="opt in choiceOptions(cur)"
							:key="opt.key"
							class="option"
							:class="{ active: answers[cur.question_id] === opt.key }"
							@click="answers[cur.question_id] = opt.key"
						>
							<text class="opt-key">{{ opt.key }}</text>
							<text class="opt-text">{{ opt.label }}</text>
						</view>
					</view>

					<!-- 多选 -->
					<view v-if="cur.question.type === 'multiple'">
						<view
							v-for="o in cur.question.options"
							:key="o.key"
							class="option"
							:class="{ active: (answers[cur.question_id] || []).includes(o.key) }"
							@click="toggleMulti(cur.question_id, o.key)"
						>
							<text class="opt-key">{{ o.key }}</text>
							<text class="opt-text">{{ o.text }}</text>
						</view>
					</view>

					<!-- 填空 / 简答 -->
					<view v-if="cur.question.type === 'fill' || cur.question.type === 'essay'">
						<textarea
							class="form-textarea"
							v-model="answers[cur.question_id]"
							placeholder="请输入答案"
							:maxlength="-1"
							:auto-height="cur.question.type === 'essay'"
						/>
					</view>

					<view class="nav-row">
						<button class="btn-plain" :disabled="current === 0" @click="current--">上一题</button>
						<button
							class="btn-primary"
							:disabled="current === paper.questions.length - 1"
							@click="current++"
						>{{ current === paper.questions.length - 1 ? '已是最后一题' : '下一题' }}</button>
					</view>
				</view>
			</view>

			<!-- ===== 右：考试信息与交卷 ===== -->
			<view class="q-side">
				<view class="card side-card">
					<view class="sc-label">考试名称</view>
					<view class="sc-name">{{ paper.exam_title || paper.title }}</view>
				</view>

				<view class="card timer-card" :class="{ danger: remainSec <= 300 }">
					<view class="sc-label">剩余时间</view>
					<view class="timer-num">{{ timeText }}</view>
				</view>

				<view class="card side-card">
					<view class="sc-row">
						<text class="muted">答题进度</text>
						<text class="sc-val">{{ answeredCount }}/{{ paper.questions.length }}</text>
					</view>
					<view class="prog-track">
						<view class="prog-fill" :style="{ width: progressPct + '%' }"></view>
					</view>
					<view class="sc-row sub-score">
						<text class="muted">试卷总分</text>
						<text class="sc-val">{{ paper.total_score }} 分</text>
					</view>
				</view>

				<button class="btn-primary submit-btn" @click="onSubmit">提 交 试 卷</button>
			</view>
		</view>
	</pc-layout>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { call } from '@/common/request.js'
import { requireLogin } from '@/common/auth.js'

const typeText = { single: '单选题', multiple: '多选题', judge: '判断题', fill: '填空题', essay: '简答题' }

// 答题页高亮父级「参加考试」菜单
const activeKey = '/pages/student/exam-list/exam-list'

const examId = ref('')
const paper = ref({ questions: [] })
const answers = ref({})
const current = ref(0)
const remainSec = ref(0)
const submitted = ref(false)
let timer = null

const cur = computed(() => paper.value.questions[current.value])
const timeText = computed(() => {
	const m = Math.floor(remainSec.value / 60)
	const s = remainSec.value % 60
	return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})
// 已答题数 / 百分比，用于右侧进度
const answeredCount = computed(() => paper.value.questions.filter(q => isAnswered(q)).length)
const progressPct = computed(() => {
	const total = paper.value.questions.length
	return total ? Math.round((answeredCount.value / total) * 100) : 0
})

onLoad(async (query) => {
	if (!requireLogin()) return
	examId.value = query.exam_id
	try {
		const res = await call('qb-answer', 'getPaper', { exam_id: examId.value })
		paper.value = res
		remainSec.value = (res.duration || 60) * 60
		timer = setInterval(() => {
			remainSec.value--
			if (remainSec.value <= 0) {
				clearInterval(timer)
				doSubmit(true)
			}
		}, 1000)
	} catch (e) {
		setTimeout(() => uni.navigateBack(), 1500)
	}
})

onUnmounted(() => { if (timer) clearInterval(timer) })

function choiceOptions(q) {
	if (q.question.type === 'judge') {
		return [{ key: '对', label: '对' }, { key: '错', label: '错' }]
	}
	return q.question.options.map(o => ({ key: o.key, label: o.text }))
}

function toggleMulti(qid, key) {
	const arr = answers.value[qid] ? [...answers.value[qid]] : []
	const i = arr.indexOf(key)
	if (i >= 0) arr.splice(i, 1)
	else arr.push(key)
	answers.value[qid] = arr
}

function isAnswered(q) {
	const a = answers.value[q.question_id]
	if (Array.isArray(a)) return a.length > 0
	return a !== undefined && a !== ''
}

function onSubmit() {
	const undone = paper.value.questions.filter(q => !isAnswered(q)).length
	uni.showModal({
		title: '确认交卷',
		content: undone > 0 ? `还有 ${undone} 道题未作答，确定交卷吗？` : '确认交卷吗？',
		success: (r) => { if (r.confirm) doSubmit(false) }
	})
}

async function doSubmit(auto) {
	if (submitted.value) return
	submitted.value = true
	if (timer) clearInterval(timer)
	const list = paper.value.questions.map(q => ({
		question_id: q.question_id,
		user_answer: answers.value[q.question_id] === undefined ? '' : answers.value[q.question_id]
	}))
	try {
		const res = await call('qb-answer', 'submit', { exam_id: examId.value, answers: list })
		const msg = res.need_grading
			? `交卷成功！客观题得分 ${res.objective_score} 分，简答题待教师阅卷`
			: `交卷成功！本次得分 ${res.objective_score} 分`
		uni.showModal({
			title: auto ? '时间到，已自动交卷' : '交卷成功',
			content: msg,
			showCancel: false,
			success: () => {
				uni.redirectTo({ url: '/pages/student/exam-result/exam-result?record_id=' + res.record_id })
			}
		})
	} catch (e) {
		submitted.value = false
	}
}
</script>

<style scoped>
/* ===== 三栏布局 ===== */
.exam-wrap {
	display: grid;
	grid-template-columns: 250px minmax(0, 1fr) 270px;
	gap: 20rpx;
	align-items: start;
}

.q-nav,
.q-side {
	position: sticky;
	top: 76px;
}

/* 左：答题卡 */
.q-nav {
	background: #fff;
	border-radius: 12rpx;
	padding: 24rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.nav-scroll {
	width: 100%;
	white-space: nowrap;
}

.nav-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 14rpx;
}

.nav-cell {
	width: 60rpx;
	height: 60rpx;
	line-height: 60rpx;
	text-align: center;
	border-radius: 10rpx;
	background: #F0F2F5;
	font-size: 24rpx;
	color: #606266;
	flex-shrink: 0;
}

.nav-cell.answered {
	background: #D6E4FF;
	color: #3B7CFF;
	font-weight: 600;
}

.nav-cell.current {
	outline: 3rpx solid #3B7CFF;
}

.nav-legend {
	display: flex;
	gap: 18rpx;
	margin-top: 22rpx;
	padding-top: 18rpx;
	border-top: 1rpx solid #F0F2F5;
}

.lg-item {
	display: flex;
	align-items: center;
	gap: 6rpx;
	font-size: 20rpx;
	color: #909399;
}

.lg-box {
	width: 18rpx;
	height: 18rpx;
	border-radius: 4rpx;
}

.lg-current { outline: 2rpx solid #3B7CFF; background: #F0F2F5; }
.lg-answered { background: #D6E4FF; }
.lg-unanswered { background: #F0F2F5; }

/* 中：题目 */
.q-tags {
	display: flex;
}

.q-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.stem {
	font-size: 30rpx;
	line-height: 1.8;
	color: #1F2937;
	margin-bottom: 24rpx;
}

.option {
	display: flex;
	align-items: flex-start;
	gap: 16rpx;
	border: 1rpx solid #DCDFE6;
	border-radius: 12rpx;
	padding: 22rpx 24rpx;
	margin-bottom: 16rpx;
	background: #fff;
	transition: all 0.15s ease;
}

.opt-key {
	width: 44rpx;
	height: 44rpx;
	line-height: 44rpx;
	text-align: center;
	border-radius: 50%;
	background: #F0F2F5;
	font-size: 24rpx;
	color: #606266;
	flex-shrink: 0;
}

.opt-text {
	flex: 1;
	font-size: 28rpx;
	line-height: 44rpx;
	color: #303133;
}

.option.active {
	border-color: #3B7CFF;
	background: #F0F5FF;
}

.option.active .opt-key {
	background: #3B7CFF;
	color: #fff;
}

.option.active .opt-text {
	color: #3B7CFF;
	font-weight: 500;
}

@media (min-width: 900px) {
	.option:hover {
		border-color: #9FBDFF;
		cursor: pointer;
	}

	.nav-cell:hover {
		background: #E3EDFF;
		cursor: pointer;
	}
}

.nav-row {
	display: flex;
	justify-content: space-between;
	gap: 20rpx;
	margin-top: 28rpx;
}

.nav-row button {
	flex: 1;
}

/* 右：信息卡 */
.sc-label {
	font-size: 22rpx;
	color: #909399;
}

.sc-name {
	font-size: 27rpx;
	font-weight: 600;
	color: #1F2937;
	margin-top: 10rpx;
	line-height: 1.5;
}

.timer-card {
	text-align: center;
	background: linear-gradient(135deg, #3B7CFF, #5A8DFF);
	box-shadow: 0 8rpx 20rpx rgba(59, 124, 255, 0.25);
}

.timer-card .sc-label {
	color: rgba(255, 255, 255, 0.8);
}

.timer-num {
	font-size: 60rpx;
	font-weight: 700;
	color: #fff;
	font-variant-numeric: tabular-nums;
	margin-top: 8rpx;
	line-height: 1.2;
}

.timer-card.danger {
	background: linear-gradient(135deg, #F56C6C, #FF8A8A);
	box-shadow: 0 8rpx 20rpx rgba(245, 108, 108, 0.3);
}

.sc-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.sc-val {
	font-size: 26rpx;
	font-weight: 600;
	color: #3B7CFF;
}

.sub-score {
	margin-top: 16rpx;
}

.prog-track {
	height: 12rpx;
	background: #EEF2F7;
	border-radius: 999rpx;
	overflow: hidden;
	margin: 14rpx 0 6rpx;
}

.prog-fill {
	height: 100%;
	border-radius: 999rpx;
	background: linear-gradient(90deg, #3B7CFF, #6B9DFF);
	transition: width 0.25s ease;
}

.submit-btn {
	width: 100%;
	height: 88rpx;
	line-height: 88rpx;
	border-radius: 12rpx;
	font-size: 30rpx;
	font-weight: 600;
	letter-spacing: 6rpx;
}

/* ===== 窄屏 / 移动端：三栏降为单列 ===== */
@media (max-width: 1024px) {
	.exam-wrap {
		grid-template-columns: 1fr;
	}

	.q-nav,
	.q-side {
		position: static;
	}

	.nav-grid {
		flex-wrap: nowrap;
	}
}
</style>
