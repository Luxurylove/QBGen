'use strict';
const { db, ok, fail, checkRole } = require('qb-common')

module.exports = {
	// 分类列表（登录即可读，组卷/练习筛选共用）
	async list(params) {
		try {
			await checkRole(params.uid)
			const res = await db.collection('categories').orderBy('sort', 'asc').get()
			return ok(res.data)
		} catch (e) {
			return fail(e.message)
		}
	},

	async create(params) {
		try {
			await checkRole(params.uid, ['teacher', 'admin'])
			const { name, description = '', sort = 0 } = params
			if (!name || !name.trim()) return fail('请输入分类名称')
			const res = await db.collection('categories').add({
				name: name.trim(), description, sort: Number(sort) || 0
			})
			return ok({ _id: res.id })
		} catch (e) {
			return fail(e.message)
		}
	},

	async update(params) {
		try {
			await checkRole(params.uid, ['teacher', 'admin'])
			const { _id, name, description = '', sort = 0 } = params
			if (!_id) return fail('缺少分类ID')
			await db.collection('categories').doc(_id).update({
				name: (name || '').trim(), description, sort: Number(sort) || 0
			})
			return ok()
		} catch (e) {
			return fail(e.message)
		}
	},

	async remove(params) {
		try {
			await checkRole(params.uid, ['teacher', 'admin'])
			const { _id } = params
			if (!_id) return fail('缺少分类ID')
			const used = await db.collection('questions').where({ category_id: _id }).count()
			if (used.total > 0) return fail(`该分类下还有 ${used.total} 道试题，不能删除`)
			await db.collection('categories').doc(_id).remove()
			return ok()
		} catch (e) {
			return fail(e.message)
		}
	}
}
