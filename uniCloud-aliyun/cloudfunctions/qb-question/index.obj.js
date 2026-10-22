'use strict';
const { db, ok, fail, checkRole } = require('qb-common')

// 组合筛选条件构造
function buildWhere(params) {
	const where = {}
	if (params.category_id) where.category_id = params.category_id
	if (params.type) where.type = params.type
	if (params.difficulty) where.difficulty = Number(params.difficulty)
	if (params.keyword && params.keyword.trim()) {
		where.stem = new RegExp(params.keyword.trim(), 'i')
	}
	return where
}

module.exports = {
	// 分页列表（教师/管理员）
	async list(params) {
		try {
			await checkRole(params.uid, ['teacher', 'admin'])
			const page = Math.max(1, Number(params.page) || 1)
			const pageSize = Math.min(50, Number(params.pageSize) || 10)
			const where = buildWhere(params)
			const coll = db.collection('questions').where(where)
			const [countRes, listRes] = await Promise.all([
				coll.count(),
				coll.orderBy('created_at', 'desc').skip((page - 1) * pageSize).limit(pageSize).get()
			])
			// 补充分类名称
			const catRes = await db.collection('categories').get()
			const catMap = {}
			catRes.data.forEach(c => { catMap[c._id] = c.name })
			listRes.data.forEach(q => { q.category_name = catMap[q.category_id] || '未分类' })
			return ok({ list: listRes.data, total: countRes.total, page, pageSize })
		} catch (e) {
			return fail(e.message)
		}
	},

	// 单题详情
	async detail(params) {
		try {
			await checkRole(params.uid, ['teacher', 'admin'])
			const res = await db.collection('questions').doc(params._id).get()
			if (!res.data.length) return fail('试题不存在')
			return ok(res.data[0])
		} catch (e) {
			return fail(e.message)
		}
	},

	// 新增试题
	async create(params) {
		try {
			const user = await checkRole(params.uid, ['teacher', 'admin'])
			const q = normalize(params)
			if (!q) return fail('试题数据不完整，请检查题干/答案/选项')
			q.created_by = user._id
			q.created_at = new Date()
			const res = await db.collection('questions').add(q)
			return ok({ _id: res.id })
		} catch (e) {
			return fail(e.message)
		}
	},

	// 更新试题
	async update(params) {
		try {
			await checkRole(params.uid, ['teacher', 'admin'])
			if (!params._id) return fail('缺少试题ID')
			const q = normalize(params)
			if (!q) return fail('试题数据不完整，请检查题干/答案/选项')
			await db.collection('questions').doc(params._id).update(q)
			return ok()
		} catch (e) {
			return fail(e.message)
		}
	},

	// 删除试题
	async remove(params) {
		try {
			await checkRole(params.uid, ['teacher', 'admin'])
			if (!params._id) return fail('缺少试题ID')
			await db.collection('questions').doc(params._id).remove()
			return ok()
		} catch (e) {
			return fail(e.message)
		}
	}
}

// 校验并规范化试题数据，非法返回 null
function normalize(p) {
	const { category_id, type, difficulty, stem } = p
	const d = Number(difficulty)
	if (!category_id || !type || !d || d < 1 || d > 3) return null
	if (!stem || !stem.trim()) return null
	const q = {
		category_id,
		type,
		difficulty: d,
		stem: stem.trim(),
		analysis: (p.analysis || '').trim(),
		score: Number(p.score) || 0
	}
	if (type === 'single' || type === 'multiple') {
		const options = (p.options || []).filter(o => o.text && o.text.trim())
			.map((o, i) => ({ key: String.fromCharCode(65 + i), text: o.text.trim() }))
		if (options.length < 2) return null
		q.options = options
		if (type === 'single') {
			if (!p.answer || typeof p.answer !== 'string') return null
			q.answer = p.answer.trim()
		} else {
			if (!Array.isArray(p.answer) || p.answer.length < 2) return null
			q.answer = p.answer
		}
	} else if (type === 'judge') {
		if (p.answer !== '对' && p.answer !== '错') return null
		q.options = []
		q.answer = p.answer
	} else if (type === 'fill' || type === 'essay') {
		if (!p.answer || !String(p.answer).trim()) return null
		q.options = []
		q.answer = String(p.answer).trim()
	} else {
		return null
	}
	return q
}
