<template>
	<pc-layout :active="activeKey" title="在线练习">
		<view class="practice-wrap">
			<!-- 模式切换：胶囊分段 -->
			<view class="tabs">
				<text :class="['tab', mode === 'practice' && 'active']" @click="switchMode('practice')">随机练习</text>
				<text :class="['tab', mode === 'wrong' && 'active']" @click="switchMode('wrong')">错题本</text>
			</view>

			<!-- 随机练习：条件选择 -->
			<view v-if="mode === 'practice' && !started" class="card">
				<view class="section-title">练习条件</view>
				<view class="cond-grid">
					<view class="form-item">
						<text class="form-label">试题分类</text>
						<picker :range="categories" range-key="name" @change="e => cond.category_id = categories[e.detail.value]._id">
							<view class="picker-box">{{ cond.category_id ? catName(cond.category_id) : '全部分类' }}</view>
						</picker>
					</view>
					<view class="form-item">
						<text class="form-label">题型</text>
						<picker :range="typeOptions" @change="e => cond.type = typeValues[e.detail.value]">
							<view class="picker-box">{{ typeOptions[typeValues.indexOf(cond.type)] }}</view>
						</picker>
					</view>
					<view class="form-item">
						<text class="form-label">难度</text>
						<picker :range="diffOptions" @change="e => cond.difficulty = diffValues[e.detail.value]">
							<view class="picker-box">{{ diffOptions[diffValues.indexOf(cond.difficulty)] }}</view>
						</picker>
					</view>
					<view class="form-item">
						<text class="form-label">题目数量</text>
						<input class="form-input" type="number" v-model="cond.count" placeholder="默认5题，最多20题" />
					</view>
				</view>
				<button class="btn-primary start-btn" @click="start">开始练习</button>
			</view>

			<!-- 错题本列表 -->
			<template v-if="mode === 'wrong' && !started">
				<view v-if="!wrongList.length" class="card empty-card">
					<view class="empty-icon">📒</view>
					<view class="empty-text">暂无错题，去随机练习吧</view>
				</view>
				<view v-else class="wrong-grid">
					<view v-for="w in wrongList" :key="w._id" class="card wrong-card" @click="startWrong(w)">
						<view class="wrong-head">
							<view class="wrong-tags">
								<text class="tag tag-blue">{{ typeText[w.question.type] }}</text>
								<text class="tag tag-gray">{{ diffText[w.question.difficulty] }}</text>
							</view>
							<text class="tag tag-red">错 {{ w.wrong_count }} 次</text>
						</view>
						<view class="stem">{{ w.question.stem }}</view>
					</view>
				</view>
			</template>

			<!-- 作答区 -->
			<template v-if="started && current">
				<!-- 顶部进度卡 -->
				<view class="card progress-card">
					<view class="prog-row">
						<text class="muted">第 {{ index + 1 }} / {{ questions.length }} 题</text>
						<text class="prog-text">已答对 {{ rightCount }} 题</text>
					</view>
					<view class="prog-track">
						<view class="prog-fill" :style="{ width: ((index + 1) / questions.length) * 100 + '%' }"></view>
					</view>
				</view>

				<view class="card">
					<view class="q-head">
						<view class="q-tags">
							<text class="tag tag-blue">{{ typeText[current.type] }}</text>
							<text class="tag tag-gray">{{ diffText[current.difficulty] }}</text>
						</view>
					</view>
					<view class="stem">{{ current.stem }}</view>

					<!-- 单选 / 判断：圆形字母键 -->
					<view v-if="current.type === 'single' || current.type === 'judge'">
						<view
							v-for="o in currentOptions"
							:key="o.key"
							class="option"
							:class="{ active: answer === o.key }"
							@click="!judged && (answer = o.key)"
						>
							<text class="opt-key">{{ o.key }}</text>
							<text class="opt-text">{{ o.text || o.key }}</text>
						</view>
					</view>
					<!-- 多选 -->
					<view v-else-if="current.type === 'multiple'">
						<view
							v-for="o in currentOptions"
							:key="o.key"
							class="option"
							:class="{ active: answer.includes(o.key) }"
							@click="toggleMulti(o.key)"
						>
							<text class="opt-key">{{ o.key }}</text>
							<text class="opt-text">{{ o.text }}</text>
						</view>
					</view>
					<!-- 填空 -->
					<view v-else-if="current.type === 'fill'" class="form-item">
						<input class="form-input" v-model="answer" :disabled="judged" placeholder="请输入答案" />
					</view>

					<!-- 判分结果：正误色块 + 圆形图标 -->
					<view v-if="judged" :class="['result', result.is_correct ? 'result-right' : 'result-wrong']">
						<view class="result-head">
							<text class="result-icon">{{ result.is_correct ? '✓' : '✕' }}</text>
							<text class="result-title">{{ result.is_correct ? '回答正确' : '回答错误' }}</text>
						</view>
						<view class="ra">参考答案：{{ fmtAnswer(result.answer) }}</view>
						<view v-if="result.analysis" class="result-line">解析：{{ result.analysis }}</view>
						<view v-if="!result.is_correct" class="result-line">已自动收录到错题本</view>
					</view>

					<view class="action-row">
						<button v-if="!judged" class="btn-primary action-btn" @click="submitAnswer">提交答案</button>
						<button v-else class="btn-primary action-btn" @click="next">
							{{ index + 1 >= questions.length ? '完成练习' : '下一题' }}
						</button>
					</view>
				</view>
			</template>

			<!-- 练习结束：居中卡片 -->
			<view v-if="finished" class="card finish">
				<view class="finish-icon">🎉</view>
				<view class="finish-num">{{ rightCount }} / {{ questions.length }}</view>
				<view class="muted">本轮答对题数</view>
				<button class="btn-primary finish-btn" @click="reset">再来一组</button>
			</view>
		</view>
	</pc-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { call } from '@/common/request.js'
import { requireLogin } from '@/common/auth.js'

const activeKey = '/pages/student/practice/practice'
const typeText = { single: '单选', multiple: '多选', judge: '判断', fill: '填空', essay: '简答' }
const diffText = { 1: '简单', 2: '中等', 3: '困难' }
const typeOptions = ['全部题型', '单选题', '多选题', '判断题', '填空题']
const typeValues = ['', 'single', 'multiple', 'judge', 'fill']
const diffOptions = ['全部难度', '简单', '中等', '困难']
const diffValues = ['', 1, 2, 3]

const mode = ref('practice')
const categories = ref([])
const cond = ref({ category_id: '', type: '', difficulty: '', count: 5 })
const wrongList = ref([])

const started = ref(false)
const finished = ref(false)
const questions = ref([])
const index = ref(0)
const answer = ref('')
const judged = ref(false)
const result = ref({})
const rightCount = ref(0)

const current = computed(() => questions.value[index.value] || null)
const currentOptions = computed(() => {
	if (!current.value) return []
	if (current.value.type === 'judge') return [{ key: '对', text: '' }, { key: '错', text: '' }]
	return current.value.options || []
})

onShow(async () => {
	if (!requireLogin()) return
	categories.value = await call('qb-category', 'list')
	loadWrong()
})

function catName(id) {
	const c = categories.value.find(x => x._id === id)
	return c ? c.name : '全部分类'
}

async function loadWrong() {
	wrongList.value = await call('qb-practice', 'listWrong')
}

function switchMode(m) {
	mode.value = m
	reset()
	if (m === 'wrong') loadWrong()
}

async function start() {
	const params = { ...cond.value }
	const list = await call('qb-practice', 'getQuestions', params)
	if (!list.length) {
		uni.showToast({ title: '没有符合条件的题目', icon: 'none' })
		return
	}
	beginRun(list)
}

function startWrong(w) {
	beginRun([w.question])
}

function beginRun(list) {
	questions.value = list
	index.value = 0
	rightCount.value = 0
	finished.value = false
	started.value = true
	resetAnswer()
}

function resetAnswer() {
	answer.value = current.value && current.value.type === 'multiple' ? [] : ''
	judged.value = false
	result.value = {}
}

function toggleMulti(key) {
	if (judged.value) return
	const i = answer.value.indexOf(key)
	if (i >= 0) answer.value.splice(i, 1)
	else answer.value.push(key)
}

async function submitAnswer() {
	const ua = answer.value
	if (ua === '' || (Array.isArray(ua) && !ua.length)) {
		uni.showToast({ title: '请先作答', icon: 'none' })
		return
	}
	result.value = await call('qb-practice', 'submit', {
		question_id: current.value._id,
		user_answer: ua
	})
	judged.value = true
	if (result.value.is_correct) rightCount.value++
}

function next() {
	if (index.value + 1 >= questions.value.length) {
		started.value = false
		finished.value = true
		loadWrong()
		return
	}
	index.value++
	resetAnswer()
}

function reset() {
	started.value = false
	finished.value = false
	questions.value = []
	index.value = 0
	rightCount.value = 0
}

function fmtAnswer(a) {
	if (Array.isArray(a)) return a.join('、')
	return a
}
</script>

<style scoped>
/* 限宽容器：宽屏居中 */
.practice-wrap {
	max-width: 980px;
	margin: 0 auto;
}

/* ===== 胶囊分段：白底圆角容器 + 渐变选中 ===== */
.tabs {
	display: flex;
	gap: 8rpx;
	padding: 8rpx;
	background: #fff;
	border-radius: 999rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
	margin-bottom: 20rpx;
}

.tab {
	flex: 1;
	text-align: center;
	font-size: 28rpx;
	color: #606266;
	padding: 16rpx 0;
	border-radius: 999rpx;
	transition: all 0.2s ease;
}

.tab.active {
	background: linear-gradient(135deg, #3B7CFF, #5A8DFF);
	color: #fff;
	font-weight: 600;
	box-shadow: 0 4rpx 12rpx rgba(59, 124, 255, 0.28);
}

/* ===== 练习条件：宽屏两列 grid ===== */
.cond-grid {
	display: grid;
	grid-template-columns: 1fr;
	column-gap: 32rpx;
}

@media (min-width: 900px) {
	.cond-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

.start-btn {
	margin-top: 8rpx;
	min-width: 240rpx;
}

.picker-box {
	background: #F4F6FA;
	border-radius: 10rpx;
	padding: 16rpx 20rpx;
	font-size: 28rpx;
}

/* ===== 错题本 ===== */
.wrong-grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: 20rpx;
}

.wrong-grid > .card {
	margin: 0;
}

@media (min-width: 900px) {
	.wrong-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

.wrong-card {
	cursor: pointer;
}

.wrong-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.wrong-tags {
	display: flex;
}

.stem {
	margin: 16rpx 0 0;
	line-height: 1.7;
	color: #1F2937;
	font-size: 28rpx;
}

/* ===== 顶部进度卡 ===== */
.progress-card {
	padding: 24rpx 28rpx;
}

.prog-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.prog-text {
	font-size: 24rpx;
	font-weight: 600;
	color: #3B7CFF;
}

.prog-track {
	height: 12rpx;
	background: #EEF2F7;
	border-radius: 999rpx;
	overflow: hidden;
	margin-top: 16rpx;
}

.prog-fill {
	height: 100%;
	border-radius: 999rpx;
	background: linear-gradient(90deg, #3B7CFF, #6B9DFF);
	transition: width 0.25s ease;
}

/* ===== 题目卡 ===== */
.q-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.q-tags {
	display: flex;
}

/* 选项：圆形字母键（同 take-exam） */
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
}

/* ===== 判分结果 ===== */
.result {
	border-radius: 12rpx;
	padding: 24rpx;
	margin: 20rpx 0;
	font-size: 28rpx;
}

.result-right {
	background: #EDF9F1;
	color: #19A15F;
}

.result-wrong {
	background: #FEF0F0;
	color: #F56C6C;
}

.result-head {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 12rpx;
}

.result-icon {
	width: 44rpx;
	height: 44rpx;
	line-height: 44rpx;
	text-align: center;
	border-radius: 50%;
	font-size: 28rpx;
	color: #fff;
	flex-shrink: 0;
}

.result-right .result-icon {
	background: #19A15F;
}

.result-wrong .result-icon {
	background: #F56C6C;
}

.result-title {
	font-size: 30rpx;
	font-weight: 600;
}

.result-line {
	margin-top: 6rpx;
	line-height: 1.6;
	opacity: 0.85;
}

.ra {
	margin: 8rpx 0;
	line-height: 1.6;
}

/* 操作按钮区 */
.action-row {
	display: flex;
	justify-content: center;
	margin-top: 28rpx;
}

.action-btn {
	min-width: 280rpx;
}

/* ===== 练习结束卡 ===== */
.finish {
	text-align: center;
	padding: 80rpx 24rpx;
}

.finish-icon {
	font-size: 88rpx;
	line-height: 1;
	margin-bottom: 24rpx;
}

.finish-num {
	font-size: 80rpx;
	font-weight: 700;
	color: #3B7CFF;
	line-height: 1.1;
	margin-bottom: 10rpx;
}

.finish-btn {
	margin-top: 40rpx;
	min-width: 280rpx;
}

/* ===== 空状态 ===== */
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

/* ===== 窄屏 ===== */
@media (max-width: 768px) {
	.action-btn,
	.start-btn,
	.finish-btn {
		min-width: 0;
		width: 100%;
	}

	.finish-num {
		font-size: 68rpx;
	}
}
</style>
