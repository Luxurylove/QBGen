<template>
	<pc-layout :active="activeKey" title="数据统计">
		<!-- 顶部概览：6 个统计卡 -->
		<view class="stat-grid">
			<view class="stat-box" v-for="s in countCards" :key="s.label">
				<view class="stat-box-icon"></view>
				<view class="stat-box-text">
					<view class="stat-box-val">{{ s.value }}</view>
					<view class="stat-box-label">{{ s.label }}</view>
				</view>
			</view>
		</view>

		<view class="charts">
			<!-- 题型分布 -->
			<view class="card">
				<view class="card-title">题型分布</view>
				<view v-for="t in overview.typeStats" :key="t.type" class="bar-row">
					<text class="bar-label">{{ t.type_text }}</text>
					<view class="bar-track">
						<view class="bar-fill bar-blue" :style="{ width: pct(t.count, overview.counts.questions) + '%' }"></view>
					</view>
					<text class="bar-val">{{ t.count }}</text>
				</view>
			</view>

			<!-- 难度分布 -->
			<view class="card">
				<view class="card-title">难度分布</view>
				<view v-for="d in overview.diffStats" :key="d.difficulty" class="bar-row">
					<text class="bar-label">{{ d.diff_text }}</text>
					<view class="bar-track">
						<view class="bar-fill bar-green" :style="{ width: pct(d.count, overview.counts.questions) + '%' }"></view>
					</view>
					<text class="bar-val">{{ d.count }}</text>
				</view>
			</view>

			<!-- 各考试成绩 -->
			<view class="card exam-card" v-if="scores.length">
				<view class="card-title">各考试成绩</view>
				<view v-for="e in scores" :key="e.exam_id" class="exam-block">
					<view class="row-between">
						<text class="exam-name">{{ e.exam_title }}</text>
						<text class="muted">{{ e.count }} 人已出分</text>
					</view>
					<view class="muted line">平均分 {{ e.avg_score }} · 及格率 {{ e.pass_rate }}%</view>
					<view class="bands">
						<view v-for="(b, i) in e.bands" :key="i" class="band">
							<view class="band-track">
								<view class="band-fill" :style="{ height: bandHeight(b, e.bands) + '%' }"></view>
							</view>
							<text class="band-num">{{ b }}</text>
							<text class="band-label">{{ bandLabels[i] }}</text>
						</view>
					</view>
				</view>
			</view>
			<view v-else class="empty-tip">暂无已出分的考试数据</view>
		</view>
	</pc-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { call } from '@/common/request.js'
import { requireLogin } from '@/common/auth.js'

const activeKey = '/pages/admin/stats/stats'
const overview = ref({ counts: {}, roleStats: [], typeStats: [], diffStats: [] })
const scores = ref([])
const bandLabels = ['<60', '60-69', '70-79', '80-89', '90+']

const countCards = computed(() => {
	const c = overview.value.counts
	return [
		{ label: '用户', value: c.users || 0 },
		{ label: '分类', value: c.categories || 0 },
		{ label: '题目', value: c.questions || 0 },
		{ label: '试卷', value: c.papers || 0 },
		{ label: '考试', value: c.exams || 0 },
		{ label: '答卷', value: c.exam_records || 0 }
	]
})

onShow(async () => {
	if (!requireLogin()) return
	overview.value = await call('qb-stats', 'overview')
	scores.value = await call('qb-stats', 'scoreStats')
})

function pct(n, total) {
	return total > 0 ? Math.round((n / total) * 100) : 0
}

function bandHeight(n, bands) {
	const max = Math.max(...bands, 1)
	return Math.round((n / max) * 100)
}
</script>

<style scoped>
/* ===== 概览卡图标：按顺序注入 emoji 与浅色底（不改 script / v-for） ===== */
.stat-box-icon::before {
	line-height: 1;
}

.stat-grid .stat-box:nth-child(1) .stat-box-icon {
	background: #E8F0FF;
}

.stat-grid .stat-box:nth-child(1) .stat-box-icon::before {
	content: '👥';
}

.stat-grid .stat-box:nth-child(2) .stat-box-icon {
	background: #F3E8FF;
}

.stat-grid .stat-box:nth-child(2) .stat-box-icon::before {
	content: '🗂️';
}

.stat-grid .stat-box:nth-child(3) .stat-box-icon {
	background: #E6F7EC;
}

.stat-grid .stat-box:nth-child(3) .stat-box-icon::before {
	content: '📚';
}

.stat-grid .stat-box:nth-child(4) .stat-box-icon {
	background: #FFF3E4;
}

.stat-grid .stat-box:nth-child(4) .stat-box-icon::before {
	content: '📄';
}

.stat-grid .stat-box:nth-child(5) .stat-box-icon {
	background: #E0F7FA;
}

.stat-grid .stat-box:nth-child(5) .stat-box-icon::before {
	content: '📋';
}

.stat-grid .stat-box:nth-child(6) .stat-box-icon {
	background: #FDECEC;
}

.stat-grid .stat-box:nth-child(6) .stat-box-icon::before {
	content: '📝';
}

/* ===== 图表区：窄屏单列，宽屏两列 ===== */
.charts {
	display: grid;
	grid-template-columns: 1fr;
	gap: 20rpx;
}

.charts > .card {
	margin-bottom: 0;
}

.card-title {
	font-weight: 600;
	font-size: 29rpx;
	color: #1F2937;
	margin-bottom: 24rpx;
}

/* 横向条形图：标签 + 轨道 + 填充 + 数值 */
.bar-row {
	display: flex;
	align-items: center;
	gap: 16rpx;
	margin-bottom: 18rpx;
}

.bar-row:last-child {
	margin-bottom: 0;
}

.bar-label {
	width: 110rpx;
	font-size: 26rpx;
	color: #606266;
	flex-shrink: 0;
}

.bar-track {
	flex: 1;
	height: 22rpx;
	background: #F4F6FA;
	border-radius: 999rpx;
	overflow: hidden;
	min-width: 0;
}

.bar-fill {
	height: 100%;
	border-radius: 999rpx;
}

.bar-blue {
	background: linear-gradient(90deg, #3B7CFF, #6B9DFF);
}

.bar-green {
	background: linear-gradient(90deg, #19A15F, #45C785);
}

.bar-val {
	width: 60rpx;
	font-size: 26rpx;
	color: #606266;
	text-align: right;
	flex-shrink: 0;
}

/* ===== 各考试成绩 ===== */
.exam-block {
	border-top: 1rpx solid #F0F2F5;
	padding-top: 20rpx;
	margin-top: 20rpx;
}

.exam-block:first-of-type {
	border-top: none;
	padding-top: 0;
	margin-top: 0;
}

.exam-name {
	font-weight: 600;
	color: #1F2937;
	font-size: 28rpx;
}

.line {
	margin-top: 8rpx;
}

/* 5 段分数柱 */
.bands {
	display: grid;
	grid-template-columns: repeat(5, minmax(0, 1fr));
	margin-top: 28rpx;
}

.band {
	display: flex;
	flex-direction: column;
	align-items: center;
	min-width: 0;
}

.band-track {
	height: 170rpx;
	width: 44rpx;
	background: #F4F6FA;
	border-radius: 8rpx;
	display: flex;
	align-items: flex-end;
	overflow: hidden;
}

.band-fill {
	width: 100%;
	background: linear-gradient(180deg, #6B9DFF, #3B7CFF);
	border-radius: 8rpx;
	min-height: 4rpx;
}

.band-num {
	font-size: 24rpx;
	color: #303133;
	margin-top: 10rpx;
}

.band-label {
	font-size: 22rpx;
	color: #909399;
	margin-top: 2rpx;
}

/* ===== 宽屏布局 ===== */
@media (min-width: 900px) {
	.charts {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.exam-card {
		grid-column: 1 / -1;
	}

	.charts > .empty-tip {
		grid-column: 1 / -1;
	}

	.bar-track {
		height: 24rpx;
	}

	.band-track {
		height: 200rpx;
		width: 48rpx;
	}
}

/* 超宽屏：概览一行 6 卡 */
@media (min-width: 1200px) {
	.stat-grid {
		grid-template-columns: repeat(6, minmax(0, 1fr));
	}
}
</style>
