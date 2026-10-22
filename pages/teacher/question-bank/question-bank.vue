<template>
	<pc-layout :active="activeKey" title="题库管理">
		<!-- 筛选栏 -->
		<view class="card">
			<view class="filter-bar">
				<view class="field">
					<text class="field-label">分类</text>
					<picker :range="catNames" @change="onCatChange">
						<view class="filter-select">{{ catIndex >= 0 ? catNames[catIndex] : '全部分类' }}</view>
					</picker>
				</view>
				<view class="field">
					<text class="field-label">题型</text>
					<picker :range="typeNames" @change="onTypeChange">
						<view class="filter-select">{{ typeIndex >= 0 ? typeNames[typeIndex] : '全部题型' }}</view>
					</picker>
				</view>
				<view class="field">
					<text class="field-label">难度</text>
					<picker :range="diffNames" @change="onDiffChange">
						<view class="filter-select">{{ diffIndex >= 0 ? diffNames[diffIndex] : '全部难度' }}</view>
					</picker>
				</view>
				<view class="field search-field">
					<input class="form-input search-input" v-model="keyword" placeholder="输入题干关键词" @confirm="search" />
					<button class="btn-primary btn-sm search-btn" @click="search">搜索</button>
				</view>
			</view>
		</view>

		<view class="page-bar">
			<text class="muted">共 {{ total }} 道题</text>
			<view class="page-bar-ops">
				<button class="btn-primary" @click="goEdit('')">+ 新增试题</button>
			</view>
		</view>

		<!-- 试题表格 -->
		<view v-if="list.length === 0" class="card table-card">
			<view class="empty-tip">暂无试题，点击右上角新增</view>
		</view>
		<view v-else class="card table-card">
			<view class="tbl-scroll">
				<view class="vtable q-cols">
					<view class="vhead q-cols">
						<view class="vth">题目</view>
						<view class="vth">分类</view>
						<view class="vth">题型</view>
						<view class="vth">难度</view>
						<view class="vth">分值</view>
						<view class="vth col-ops">操作</view>
					</view>
					<view class="vrow q-cols" v-for="q in list" :key="q._id">
						<view class="vtd">
							<view class="cell-wrap">
								<view class="cell-main cell-clamp">{{ q.stem }}</view>
								<view class="cell-sub cell-clamp">答案：{{ formatAnswer(q) }}</view>
							</view>
						</view>
						<view class="vtd">{{ q.category_name }}</view>
						<view class="vtd">
							<text class="tag tag-blue">{{ typeText[q.type] }}</text>
						</view>
						<view class="vtd">
							<text class="tag" :class="diffClass[q.difficulty]">{{ diffText[q.difficulty] }}</text>
						</view>
						<view class="vtd">{{ q.score }} 分</view>
						<view class="vtd col-ops">
							<text class="op-link op-edit" @click="goEdit(q._id)">编辑</text>
							<text class="op-link op-del" @click="onRemove(q)">删除</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 分页 -->
		<view class="pager" v-if="total > pageSize">
			<button class="btn-plain btn-sm" :disabled="page <= 1" @click="changePage(-1)">上一页</button>
			<text class="pager-info">第 {{ page }} / {{ maxPage }} 页</text>
			<button class="btn-plain btn-sm" :disabled="page >= maxPage" @click="changePage(1)">下一页</button>
		</view>
	</pc-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { call } from '@/common/request.js'
import { requireLogin } from '@/common/auth.js'

const activeKey = '/pages/teacher/question-bank/question-bank'

const typeText = { single: '单选', multiple: '多选', judge: '判断', fill: '填空', essay: '简答' }
const diffText = { 1: '简单', 2: '中等', 3: '困难' }
const diffClass = { 1: 'tag-green', 2: 'tag-orange', 3: 'tag-red' }

const cats = ref([])
const catNames = computed(() => cats.value.map(c => c.name))
const catIndex = ref(-1)
const typeNames = ['单选题', '多选题', '判断题', '填空题', '简答题']
const typeKeys = ['single', 'multiple', 'judge', 'fill', 'essay']
const typeIndex = ref(-1)
const diffNames = ['简单', '中等', '困难']
const diffIndex = ref(-1)
const keyword = ref('')

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 10
const maxPage = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

onShow(async () => {
	if (!requireLogin()) return
	const c = await call('qb-category', 'list')
	cats.value = c
	load()
})

function buildParams() {
	const p = { page: page.value, pageSize, keyword: keyword.value }
	if (catIndex.value >= 0) p.category_id = cats.value[catIndex.value]._id
	if (typeIndex.value >= 0) p.type = typeKeys[typeIndex.value]
	if (diffIndex.value >= 0) p.difficulty = diffIndex.value + 1
	return p
}

async function load() {
	const res = await call('qb-question', 'list', buildParams())
	list.value = res.list
	total.value = res.total
}

function search() { page.value = 1; load() }
function onCatChange(e) { catIndex.value = Number(e.detail.value); search() }
function onTypeChange(e) { typeIndex.value = Number(e.detail.value); search() }
function onDiffChange(e) { diffIndex.value = Number(e.detail.value); search() }
function changePage(step) { page.value += step; load() }

function goEdit(id) {
	uni.navigateTo({ url: '/pages/teacher/question-edit/question-edit' + (id ? '?id=' + id : '') })
}

function onRemove(q) {
	uni.showModal({
		title: '确认删除',
		content: '确定删除该试题吗？',
		success: async (r) => {
			if (!r.confirm) return
			await call('qb-question', 'remove', { _id: q._id })
			uni.showToast({ title: '已删除', icon: 'success' })
			load()
		}
	})
}

function formatAnswer(q) {
	if (q.type === 'multiple') return (q.answer || []).join('、')
	if (typeof q.answer === 'string' && q.answer.length > 20) return q.answer.slice(0, 20) + '…'
	return q.answer
}
</script>

<style scoped>
/* 表格列模板：题目占宽，其余紧凑；vhead/vrow 同 class 保证对齐 */
.q-cols {
	grid-template-columns: minmax(0, 2.6fr) 1.1fr 0.9fr 0.9fr 0.8fr 1.2fr;
	min-width: 860px;
}

.cell-wrap {
	min-width: 0;
	width: 100%;
}

/* 长文本截断为两行 */
.cell-clamp {
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	word-break: break-all;
}

/* 筛选栏搜索组：宽屏占据剩余空间靠右 */
.search-field {
	flex: 1 1 320rpx;
	min-width: 0;
}

.search-input {
	flex: 1;
	min-width: 0;
}

.search-btn {
	flex-shrink: 0;
}

/* 分页：居中排列 */
.pager {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 24rpx;
	padding: 24rpx 0 16rpx;
}

.pager-info {
	font-size: 24rpx;
	color: #909399;
}

/* 窄屏：筛选栏保持 wrap 可换行；表格由 tbl-scroll 横向滚动 */
@media (max-width: 768px) {
	.search-field {
		flex: 1 1 100%;
	}
}
</style>
