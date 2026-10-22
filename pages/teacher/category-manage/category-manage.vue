<template>
	<pc-layout :active="activeKey" title="分类管理">
		<!-- 顶部：新增/编辑表单卡 -->
		<view class="card">
			<view class="section-title">{{ editingId ? '编辑分类' : '新增分类' }}</view>
			<view class="form-grid">
				<view class="form-item">
					<text class="form-label"><text class="req">*</text>分类名称</text>
					<input class="form-input" v-model="name" placeholder="如：数据结构" />
				</view>
				<view class="form-item">
					<text class="form-label">说明（可选）</text>
					<input class="form-input" v-model="description" placeholder="分类说明" />
				</view>
				<view class="form-item">
					<text class="form-label">排序号</text>
					<input class="form-input" type="number" v-model.number="sort" placeholder="数字越小越靠前" />
				</view>
			</view>
			<view class="btn-row">
				<button class="btn-primary" @click="onSave">{{ editingId ? '保存修改' : '新增分类' }}</button>
				<button class="btn-plain" v-if="editingId" @click="resetForm">取消编辑</button>
			</view>
		</view>

		<!-- 分类表格 -->
		<view v-if="list.length === 0" class="card table-card">
			<view class="empty-tip">暂无分类</view>
		</view>
		<view v-else class="card table-card">
			<view class="tbl-scroll">
				<view class="vtable cat-cols">
					<view class="vhead cat-cols">
						<view class="vth">分类名称</view>
						<view class="vth">排序</view>
						<view class="vth col-ops">操作</view>
					</view>
					<view class="vrow cat-cols" v-for="c in list" :key="c._id">
						<view class="vtd">
							<view class="cell-wrap">
								<view class="cell-main">{{ c.name }}</view>
								<view class="cell-sub">{{ c.description || '暂无说明' }}</view>
							</view>
						</view>
						<view class="vtd">{{ c.sort }}</view>
						<view class="vtd col-ops">
							<text class="op-link op-edit" @click="onEdit(c)">编辑</text>
							<text class="op-link op-del" @click="onRemove(c)">删除</text>
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

const activeKey = '/pages/teacher/category-manage/category-manage'

const list = ref([])
const name = ref('')
const description = ref('')
const sort = ref(0)
const editingId = ref('')

onShow(() => {
	if (!requireLogin()) return
	load()
})

async function load() {
	list.value = await call('qb-category', 'list')
}

function resetForm() {
	name.value = ''
	description.value = ''
	sort.value = 0
	editingId.value = ''
}

function onEdit(c) {
	editingId.value = c._id
	name.value = c.name
	description.value = c.description || ''
	sort.value = c.sort || 0
}

async function onSave() {
	if (!name.value.trim()) return uni.showToast({ title: '请输入分类名称', icon: 'none' })
	const data = { name: name.value, description: description.value, sort: sort.value }
	if (editingId.value) {
		data._id = editingId.value
		await call('qb-category', 'update', data)
	} else {
		await call('qb-category', 'create', data)
	}
	uni.showToast({ title: '已保存', icon: 'success' })
	resetForm()
	load()
}

function onRemove(c) {
	uni.showModal({
		title: '确认删除',
		content: `确定删除分类「${c.name}」吗？`,
		success: async (r) => {
			if (!r.confirm) return
			await call('qb-category', 'remove', { _id: c._id })
			uni.showToast({ title: '已删除', icon: 'success' })
			load()
		}
	})
}
</script>

<style scoped>
/* 宽屏三列表单，窄屏堆叠 */
.form-grid {
	display: grid;
	grid-template-columns: 1fr;
	column-gap: 24rpx;
}

@media (min-width: 900px) {
	.form-grid {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
}

/* 按钮并排：宽屏按钮靠右侧、限宽 */
.btn-row {
	display: flex;
	gap: 16rpx;
}

@media (min-width: 900px) {
	.btn-row {
		justify-content: flex-end;
	}

	.btn-row button {
		min-width: 200rpx;
	}
}

/* 表格列模板 */
.cat-cols {
	grid-template-columns: minmax(0, 3fr) 1fr 1.4fr;
	min-width: 760px;
}

.cell-wrap {
	min-width: 0;
	width: 100%;
}

/* 窄屏：按钮占满一行 */
@media (max-width: 768px) {
	.btn-row button {
		flex: 1;
	}
}
</style>
