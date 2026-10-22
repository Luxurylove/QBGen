<template>
	<pc-layout :active="activeKey" title="试题编辑">
		<view class="edit-wrap">
			<view class="card">
				<view class="section-title">基本信息</view>

				<view class="form-item">
					<text class="form-label"><text class="req">*</text>所属分类</text>
					<picker :range="catNames" :value="catIndex" @change="e => catIndex = Number(e.detail.value)">
						<view class="picker-view">{{ catIndex >= 0 ? catNames[catIndex] : '请选择分类' }}</view>
					</picker>
				</view>

				<view class="form-item">
					<text class="form-label">题型</text>
					<view class="seg">
						<text
							v-for="(t, i) in typeNames"
							:key="i"
							class="seg-item"
							:class="{ active: typeIndex === i }"
							@click="onTypeChange(i)"
						>{{ t }}</text>
					</view>
				</view>

				<view class="field-grid">
					<view class="form-item">
						<text class="form-label">难度</text>
						<view class="seg">
							<text
								v-for="(d, i) in ['简单', '中等', '困难']"
								:key="i"
								class="seg-item"
								:class="{ active: difficulty === i + 1 }"
								@click="difficulty = i + 1"
							>{{ d }}</text>
						</view>
					</view>
					<view class="form-item">
						<text class="form-label">默认分值</text>
						<input class="form-input" type="number" v-model.number="score" placeholder="如 4" />
					</view>
				</view>

				<view class="form-item">
					<text class="form-label"><text class="req">*</text>题干</text>
					<textarea class="form-textarea" v-model="stem" placeholder="请输入题干" :maxlength="-1" />
				</view>

				<!-- 单选/多选选项 -->
				<template v-if="isChoice">
					<view class="form-item">
						<text class="form-label">选项编辑</text>
						<view class="option-list">
							<view class="option-row" v-for="(o, i) in options" :key="i">
								<text class="opt-badge">{{ String.fromCharCode(65 + i) }}</text>
								<input class="form-input option-input" v-model="o.text" placeholder="选项内容" />
								<button
									v-if="options.length > 2"
									class="btn-danger btn-sm opt-del"
									@click="options.splice(i, 1)"
								>删除</button>
							</view>
						</view>
						<button
							v-if="options.length < 8"
							class="btn-plain btn-sm add-option"
							@click="options.push({ text: '' })"
						>+ 添加选项</button>
					</view>

					<view class="form-item">
						<text class="form-label">正确答案（{{ typeKey === 'single' ? '单选' : '多选' }}）</text>
						<view class="seg">
							<text
								v-for="(o, i) in options"
								:key="i"
								class="seg-item"
								:class="{ active: isAnswered(i) }"
								@click="toggleAnswer(i)"
							>{{ String.fromCharCode(65 + i) }}</text>
						</view>
					</view>
				</template>

				<!-- 判断题 -->
				<view class="form-item" v-if="typeKey === 'judge'">
					<text class="form-label">正确答案</text>
					<view class="seg">
						<text class="seg-item" :class="{ active: judgeAnswer === '对' }" @click="judgeAnswer = '对'">对</text>
						<text class="seg-item" :class="{ active: judgeAnswer === '错' }" @click="judgeAnswer = '错'">错</text>
					</view>
				</view>

				<!-- 填空/简答 -->
				<view class="form-item" v-if="typeKey === 'fill' || typeKey === 'essay'">
					<text class="form-label">参考答案</text>
					<textarea class="form-textarea" v-model="textAnswer" placeholder="请输入参考答案" :maxlength="-1" />
				</view>

				<view class="form-item">
					<text class="form-label">答案解析（可选）</text>
					<textarea class="form-textarea" v-model="analysis" placeholder="请输入解析" :maxlength="-1" />
				</view>

				<view class="form-foot">
					<button class="btn-primary save-btn" @click="onSave">保存试题</button>
				</view>
			</view>
		</view>
	</pc-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { call } from '@/common/request.js'
import { requireLogin } from '@/common/auth.js'

// 子页面：高亮父级「题库管理」菜单
const activeKey = '/pages/teacher/question-bank/question-bank'

const typeNames = ['单选题', '多选题', '判断题', '填空题', '简答题']
const typeKeys = ['single', 'multiple', 'judge', 'fill', 'essay']

const editId = ref('')
const cats = ref([])
const catNames = computed(() => cats.value.map(c => c.name))
const catIndex = ref(-1)
const typeIndex = ref(0)
const typeKey = computed(() => typeKeys[typeIndex.value])
const isChoice = computed(() => typeKey.value === 'single' || typeKey.value === 'multiple')
const difficulty = ref(1)
const score = ref(4)
const stem = ref('')
const options = ref([{ text: '' }, { text: '' }, { text: '' }, { text: '' }])
const singleAnswer = ref('')
const multiAnswer = ref([])
const judgeAnswer = ref('')
const textAnswer = ref('')
const analysis = ref('')

onLoad(async (query) => {
	if (!requireLogin()) return
	cats.value = await call('qb-category', 'list')
	if (query && query.id) {
		editId.value = query.id
		uni.setNavigationBarTitle({ title: '编辑试题' })
		const q = await call('qb-question', 'detail', { _id: query.id })
		catIndex.value = cats.value.findIndex(c => c._id === q.category_id)
		typeIndex.value = typeKeys.indexOf(q.type)
		difficulty.value = q.difficulty
		score.value = q.score
		stem.value = q.stem
		analysis.value = q.analysis || ''
		if (q.type === 'single') {
			options.value = q.options.map(o => ({ text: o.text }))
			singleAnswer.value = q.answer
		} else if (q.type === 'multiple') {
			options.value = q.options.map(o => ({ text: o.text }))
			multiAnswer.value = [...q.answer]
		} else if (q.type === 'judge') {
			judgeAnswer.value = q.answer
		} else {
			textAnswer.value = q.answer
		}
	} else {
		uni.setNavigationBarTitle({ title: '新增试题' })
	}
})

function onTypeChange(i) {
	typeIndex.value = i
	const defaults = { single: 4, multiple: 8, judge: 3, fill: 7, essay: 15 }
	score.value = defaults[typeKeys[i]]
}

function isAnswered(i) {
	const k = String.fromCharCode(65 + i)
	return typeKey.value === 'single' ? singleAnswer.value === k : multiAnswer.value.includes(k)
}

function toggleAnswer(i) {
	const k = String.fromCharCode(65 + i)
	if (typeKey.value === 'single') {
		singleAnswer.value = k
	} else {
		const idx = multiAnswer.value.indexOf(k)
		if (idx >= 0) multiAnswer.value.splice(idx, 1)
		else multiAnswer.value.push(k)
	}
}

async function onSave() {
	if (catIndex.value < 0) return uni.showToast({ title: '请选择分类', icon: 'none' })
	if (!stem.value.trim()) return uni.showToast({ title: '请输入题干', icon: 'none' })

	const data = {
		category_id: cats.value[catIndex.value]._id,
		type: typeKey.value,
		difficulty: difficulty.value,
		stem: stem.value,
		score: score.value,
		analysis: analysis.value
	}
	if (isChoice.value) {
		data.options = options.value
		data.answer = typeKey.value === 'single' ? singleAnswer.value : multiAnswer.value
		if (typeKey.value === 'multiple' && data.answer.length < 2) {
			return uni.showToast({ title: '多选题至少选2个答案', icon: 'none' })
		}
	} else if (typeKey.value === 'judge') {
		data.answer = judgeAnswer.value
	} else {
		data.answer = textAnswer.value
	}

	if (editId.value) {
		data._id = editId.value
		await call('qb-question', 'update', data)
	} else {
		await call('qb-question', 'create', data)
	}
	uni.showToast({ title: '已保存', icon: 'success' })
	setTimeout(() => uni.navigateBack(), 600)
}
</script>

<style scoped>
/* 表单卡限宽，避免宽屏行过长 */
.edit-wrap {
	max-width: 900px;
}

/* 难度 + 默认分值：宽屏两列 */
.field-grid {
	display: grid;
	grid-template-columns: 1fr;
	column-gap: 32rpx;
}

@media (min-width: 900px) {
	.field-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

.picker-view {
	background: #fff;
	border: 1rpx solid #DCDFE6;
	border-radius: 10rpx;
	padding: 16rpx 20rpx;
	color: #606266;
	font-size: 28rpx;
}

/* 分段选择 */
.seg {
	display: flex;
	flex-wrap: wrap;
	gap: 14rpx;
}

.seg-item {
	background: #F0F2F5;
	border-radius: 8rpx;
	padding: 10rpx 28rpx;
	font-size: 26rpx;
	color: #606266;
	cursor: pointer;
}

.seg-item.active {
	background: #3B7CFF;
	color: #fff;
}

/* 选项编辑器：行内 字母 + 输入 + 删除 */
.option-list {
	display: flex;
	flex-direction: column;
	gap: 14rpx;
	margin-bottom: 16rpx;
}

.option-row {
	display: flex;
	align-items: center;
	gap: 14rpx;
}

.opt-badge {
	width: 52rpx;
	height: 52rpx;
	line-height: 52rpx;
	text-align: center;
	border-radius: 8rpx;
	background: #E8F0FF;
	color: #3B7CFF;
	font-size: 26rpx;
	font-weight: 600;
	flex-shrink: 0;
}

.option-input {
	flex: 1;
	min-width: 0;
}

.opt-del {
	flex-shrink: 0;
}

.add-option {
	margin-bottom: 0;
}

/* 底部保存区 */
.form-foot {
	display: flex;
	justify-content: flex-end;
	margin-top: 8rpx;
}

.save-btn {
	min-width: 240rpx;
}

/* 窄屏：删除按钮文字可保留；两列表单自动堆叠（grid 单列） */
@media (max-width: 768px) {
	.opt-badge {
		width: 44rpx;
		height: 44rpx;
		line-height: 44rpx;
	}
}
</style>
