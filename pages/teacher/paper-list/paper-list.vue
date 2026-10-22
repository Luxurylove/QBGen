<template>
	<pc-layout :active="activeKey" title="试卷管理">
		<view class="page-bar">
			<text class="muted">共 {{ list.length }} 份试卷</text>
			<view class="page-bar-ops">
				<button class="btn-primary" @click="goGen">+ 自动组卷</button>
			</view>
		</view>

		<!-- 试卷表格 -->
		<view v-if="list.length === 0" class="card table-card">
			<view class="empty-tip">暂无试卷，点击右上角自动组卷</view>
		</view>
		<view v-else class="card table-card">
			<view class="tbl-scroll">
				<view class="vtable paper-cols">
					<view class="vhead paper-cols">
						<view class="vth">试卷名称</view>
						<view class="vth">题量 / 时长 / 及格</view>
						<view class="vth">组卷方式</view>
						<view class="vth col-ops">操作</view>
					</view>
					<view class="vrow paper-cols" v-for="p in list" :key="p._id">
						<view class="vtd">
							<view class="cell-wrap">
								<view class="cell-main cell-clamp">{{ p.title }}</view>
								<view class="cell-sub">总分 {{ p.total_score }} 分</view>
							</view>
						</view>
						<view class="vtd">{{ p.questions.length }} 题 · {{ p.duration }} 分钟 · {{ p.pass_score }} 分</view>
						<view class="vtd">
							<text v-if="p.gen_config && p.gen_config.mode === 'auto'" class="tag tag-blue">自动组卷</text>
							<text v-else class="tag tag-gray">手动</text>
						</view>
						<view class="vtd col-ops">
							<text class="op-link op-view" @click="onView(p)">查看</text>
							<text class="op-link op-del" @click="onRemove(p)">删除</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- ===== 试卷详情弹层：mask + panel，panel 限宽 720px ===== -->
		<view v-if="detail" class="mask" @click="detail = null">
			<view class="panel" @click.stop>
				<view class="detail-head">
					<text class="panel-title">{{ detail.title }}</text>
					<text class="muted">总分 {{ detail.total_score }} 分 · {{ detail.questions.length }} 题</text>
				</view>
				<scroll-view scroll-y class="detail-body">
					<view v-for="(item, i) in detail.questions" :key="item.question_id" class="q-item">
						<view class="q-tags">
							<text class="tag tag-blue">{{ typeText[item.question && item.question.type] }}</text>
							<text class="tag tag-gray">{{ item.score }}分</text>
						</view>
						<view class="q-stem">{{ i + 1 }}. {{ item.question ? item.question.stem : '题目已删除' }}</view>
						<template v-if="item.question">
							<view v-if="item.question.options && item.question.options.length" class="q-options">
								<text v-for="o in item.question.options" :key="o.key" class="option-line">{{ o.key }}. {{ o.text }}</text>
							</view>
							<view class="q-answer">参考答案：{{ formatAnswer(item.question) }}</view>
							<view v-if="item.question.analysis" class="muted q-analysis">解析：{{ item.question.analysis }}</view>
						</template>
					</view>
				</scroll-view>
				<view class="detail-foot">
					<button class="btn-primary close-btn" @click="detail = null">关闭</button>
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

const activeKey = '/pages/teacher/paper-list/paper-list'

const typeText = { single: '单选', multiple: '多选', judge: '判断', fill: '填空', essay: '简答' }
const list = ref([])
const detail = ref(null)

onShow(() => {
	if (!requireLogin()) return
	load()
})

async function load() {
	list.value = await call('qb-paper', 'list')
}

function goGen() {
	uni.navigateTo({ url: '/pages/teacher/paper-gen/paper-gen' })
}

async function onView(p) {
	detail.value = await call('qb-paper', 'detail', { _id: p._id })
}

function onRemove(p) {
	uni.showModal({
		title: '确认删除',
		content: `确定删除试卷「${p.title}」吗？`,
		success: async (r) => {
			if (!r.confirm) return
			await call('qb-paper', 'remove', { _id: p._id })
			uni.showToast({ title: '已删除', icon: 'success' })
			load()
		}
	})
}

function formatAnswer(q) {
	if (q.type === 'multiple') return (q.answer || []).join('、')
	return q.answer
}
</script>

<style scoped>
/* 表格列模板 */
.paper-cols {
	grid-template-columns: minmax(0, 2.6fr) minmax(0, 2.4fr) 1.2fr 1.2fr;
	min-width: 820px;
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

/* ===== 弹层 ===== */
.mask {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 300;
}

.panel {
	background: #fff;
	border-radius: 20rpx;
	width: 92%;
	max-width: 720px;
	max-height: 84vh;
	padding: 32rpx 36rpx;
	display: flex;
	flex-direction: column;
	box-shadow: 0 24rpx 70rpx rgba(0, 0, 0, 0.22);
	box-sizing: border-box;
}

.panel-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #1F2937;
}

.detail-head {
	margin-bottom: 18rpx;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.detail-body {
	flex: 1;
	min-height: 0;
}

.q-item {
	border-top: 1rpx solid #EBEEF5;
	padding: 18rpx 0;
}

.q-tags {
	display: flex;
	flex-wrap: wrap;
}

.q-stem {
	margin: 12rpx 0;
	line-height: 1.7;
	color: #1F2937;
}

.q-options {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.option-line {
	font-size: 25rpx;
	color: #606266;
	line-height: 1.6;
}

.q-answer {
	color: #19A15F;
	font-size: 24rpx;
	margin: 10rpx 0 4rpx;
}

.q-analysis {
	font-size: 24rpx;
	line-height: 1.6;
}

.detail-foot {
	display: flex;
	justify-content: flex-end;
	margin-top: 18rpx;
}

.close-btn {
	min-width: 200rpx;
}

/* 窄屏：表格横滚；弹层宽度已用百分比自适应 */
@media (max-width: 768px) {
	.panel {
		padding: 28rpx 24rpx;
	}
}
</style>
