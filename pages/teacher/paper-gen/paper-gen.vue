<template>
	<pc-layout :active="activeKey" title="自动组卷">
		<view class="gen-wrap">
			<!-- ===== 组卷条件 ===== -->
			<view class="card">
				<view class="section-title">组卷条件</view>

				<view class="form-item">
					<text class="form-label"><text class="req">*</text>试卷标题</text>
					<input class="form-input" v-model="title" placeholder="如：数据结构单元测试卷" />
				</view>

				<view class="row-2">
					<view class="form-item">
						<text class="form-label">考试时长（分钟）</text>
						<input class="form-input" type="number" v-model.number="duration" />
					</view>
					<view class="form-item">
						<text class="form-label">及格分数</text>
						<input class="form-input" type="number" v-model.number="passScore" />
					</view>
				</view>

				<view class="form-item">
					<text class="form-label">抽题范围（不勾选则全部）</text>
					<view class="seg">
						<text
							v-for="c in cats"
							:key="c._id"
							class="seg-item"
							:class="{ active: selectedCats.includes(c._id) }"
							@click="toggleCat(c._id)"
						>{{ c.name }}</text>
					</view>
				</view>

				<!-- 题型规则行：宽屏一行 grid，窄屏堆叠；v-for 保留 -->
				<view class="rule-list">
					<view v-for="r in rules" :key="r.type" class="rule-row">
						<view class="rule-name">{{ r.name }}</view>
						<view class="rule-field">
							<text class="rule-cap">每题</text>
							<input class="mini-input" type="number" v-model.number="r.score" />
							<text class="rule-cap">分</text>
						</view>
						<view class="rule-field">
							<text class="rule-cap">数量</text>
							<input class="mini-input" type="number" v-model.number="r.count" />
						</view>
						<view class="rule-field rule-diff">
							<text class="rule-cap">难度</text>
							<view class="seg">
								<text
									v-for="(d, i) in ['随机', '简单', '中等', '困难']"
									:key="i"
									class="seg-item small"
									:class="{ active: r.difficulty === i }"
									@click="r.difficulty = i"
								>{{ d }}</text>
							</view>
						</view>
					</view>
				</view>

				<button class="btn-primary gen-btn" @click="onGen(false)">生成试卷预览</button>
			</view>

			<!-- ===== 缺额警告（暖色） ===== -->
			<view v-if="shortages.length" class="card warn-card">
				<view class="warn-title">⚠ 题库题量不足</view>
				<view v-for="(s, i) in shortages" :key="i" class="warn-line">
					{{ s.label }}：需要 {{ s.need }} 道，现有 {{ s.have }} 道
				</view>
				<text class="muted">已按现有题量生成，可减少数量或先去题库补充试题</text>
			</view>

			<!-- ===== 试卷预览 ===== -->
			<view v-if="preview.length" class="card">
				<view class="preview-head">
					<view class="section-title">试卷预览（{{ preview.length }} 题 / 共 {{ totalScore }} 分）</view>
					<button class="btn-plain btn-sm" @click="onGen(true)">换一批</button>
				</view>

				<view v-for="(item, i) in preview" :key="item.question_id" class="preview-item">
					<view class="preview-tags">
						<text class="tag tag-blue">{{ typeText[item.question.type] }}</text>
						<text class="tag" :class="diffClass[item.question.difficulty]">{{ diffText[item.question.difficulty] }}</text>
						<text class="tag tag-gray">{{ item.score }}分</text>
					</view>
					<view class="preview-stem">{{ i + 1 }}. {{ item.question.stem }}</view>
					<view v-if="item.question.options && item.question.options.length" class="preview-options">
						<text v-for="o in item.question.options" :key="o.key" class="option-line">{{ o.key }}. {{ o.text }}</text>
					</view>
				</view>

				<button class="btn-primary gen-btn" :disabled="saving" @click="onSave">保存试卷</button>
			</view>
		</view>
	</pc-layout>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { call } from '@/common/request.js'
import { requireLogin } from '@/common/auth.js'

const activeKey = '/pages/teacher/paper-gen/paper-gen'

const typeText = { single: '单选', multiple: '多选', judge: '判断', fill: '填空', essay: '简答' }
const diffText = { 1: '简单', 2: '中等', 3: '困难' }
const diffClass = { 1: 'tag-green', 2: 'tag-orange', 3: 'tag-red' }

const title = ref('')
const duration = ref(60)
const passScore = ref(60)
const cats = ref([])
const selectedCats = ref([])
const rules = ref([
	{ type: 'single', name: '单选题', count: 5, score: 4, difficulty: 0 },
	{ type: 'multiple', name: '多选题', count: 2, score: 8, difficulty: 0 },
	{ type: 'judge', name: '判断题', count: 3, score: 3, difficulty: 0 },
	{ type: 'fill', name: '填空题', count: 2, score: 7, difficulty: 0 },
	{ type: 'essay', name: '简答题', count: 1, score: 15, difficulty: 0 }
])
const preview = ref([])
const totalScore = ref(0)
const shortages = ref([])
const saving = ref(false)

onShow(async () => {
	if (!requireLogin()) return
	cats.value = await call('qb-category', 'list')
})

function toggleCat(id) {
	const i = selectedCats.value.indexOf(id)
	if (i >= 0) selectedCats.value.splice(i, 1)
	else selectedCats.value.push(id)
}

async function onGen() {
	const activeRules = rules.value.filter(r => r.count > 0)
	if (!activeRules.length) return uni.showToast({ title: '请至少设置一种题型数量', icon: 'none' })
	const res = await call('qb-paper', 'autoGen', {
		rules: activeRules,
		category_ids: selectedCats.value
	})
	preview.value = res.questions
	totalScore.value = res.total_score
	shortages.value = res.shortages
	if (!res.questions.length) {
		uni.showToast({ title: '没有抽到任何题目', icon: 'none' })
	}
}

async function onSave() {
	if (!title.value.trim()) return uni.showToast({ title: '请输入试卷标题', icon: 'none' })
	saving.value = true
	try {
		const genConfig = {
			mode: 'auto',
			rules: rules.value.filter(r => r.count > 0).map(r => ({ type: r.type, count: r.count, score: r.score, difficulty: r.difficulty })),
			category_ids: selectedCats.value
		}
		await call('qb-paper', 'save', {
			title: title.value,
			duration: duration.value,
			pass_score: passScore.value,
			questions: preview.value.map(x => ({ question_id: x.question_id, score: x.score })),
			gen_config: genConfig
		})
		uni.showToast({ title: '试卷已保存', icon: 'success' })
		setTimeout(() => uni.navigateBack(), 600)
	} finally {
		saving.value = false
	}
}
</script>

<style scoped>
/* 内容限宽 */
.gen-wrap {
	max-width: 1000px;
}

/* 时长 / 及格分：grid 两列，窄屏堆叠 */
.row-2 {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0 24rpx;
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
	padding: 10rpx 24rpx;
	font-size: 26rpx;
	color: #606266;
	cursor: pointer;
}

.seg-item.small {
	padding: 6rpx 18rpx;
	font-size: 24rpx;
}

.seg-item.active {
	background: #3B7CFF;
	color: #fff;
}

/* 题型规则行 */
.rule-list {
	border: 1rpx solid #EBEEF5;
	border-radius: 10rpx;
	overflow: hidden;
	margin-bottom: 8rpx;
}

.rule-row {
	display: grid;
	grid-template-columns: 150rpx 1fr 1fr 2fr;
	align-items: center;
	gap: 20rpx;
	padding: 20rpx 24rpx;
	border-bottom: 1rpx solid #F2F4F8;
}

.rule-row:last-child {
	border-bottom: none;
}

.rule-name {
	font-weight: 600;
	color: #1F2937;
	font-size: 26rpx;
}

.rule-field {
	display: flex;
	align-items: center;
	gap: 10rpx;
	min-width: 0;
}

.rule-diff {
	flex-wrap: wrap;
}

.rule-cap {
	font-size: 24rpx;
	color: #909399;
	white-space: nowrap;
}

.mini-input {
	width: 90rpx;
	background: #F4F6FA;
	border: 1rpx solid #E2E6ED;
	border-radius: 8rpx;
	text-align: center;
	padding: 8rpx 0;
	font-size: 26rpx;
}

/* 大按钮 */
.gen-btn {
	width: 100%;
	height: 84rpx;
	line-height: 84rpx;
	border-radius: 12rpx;
	font-size: 30rpx;
	font-weight: 600;
	margin-top: 24rpx;
}

/* 缺额警告卡：暖色 */
.warn-card {
	background: #FFF8E6;
	border: 1rpx solid #FFE1A3;
}

.warn-title {
	color: #E68A00;
	font-weight: 600;
	margin-bottom: 12rpx;
}

.warn-line {
	color: #B26A00;
	font-size: 26rpx;
	margin-bottom: 8rpx;
}

/* 预览 */
.preview-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16rpx;
}

.preview-head .section-title {
	margin-bottom: 0;
}

.preview-item {
	border-top: 1rpx solid #EBEEF5;
	padding: 22rpx 0;
}

.preview-tags {
	display: flex;
	flex-wrap: wrap;
}

.preview-stem {
	margin: 12rpx 0;
	line-height: 1.7;
	color: #1F2937;
}

.preview-options {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.option-line {
	font-size: 25rpx;
	color: #606266;
	line-height: 1.6;
}

/* 窄屏：规则行堆叠为单列；两列表单堆叠 */
@media (max-width: 768px) {
	.row-2 {
		grid-template-columns: 1fr;
	}

	.rule-row {
		grid-template-columns: 1fr;
		gap: 14rpx;
	}
}
</style>
