'use strict';
const { db, ok, fail, checkRole } = require('qb-common')

module.exports = {
	async list(params) {
		try {
			await checkRole(params.uid, ['admin'])
			const res = await db.collection('users')
				.field({ password: 0 }).orderBy('created_at', 'asc').limit(500).get()
			return ok(res.data)
		} catch (e) {
			return fail(e.message)
		}
	},

	async create(params) {
		try {
			await checkRole(params.uid, ['admin'])
			const { username, password, name, role } = params
			if (!username || !username.trim()) return fail('请输入用户名')
			if (!password) return fail('请输入密码')
			if (!name || !name.trim()) return fail('请输入姓名')
			if (!['student', 'teacher', 'admin'].includes(role)) return fail('角色不合法')
			const dup = await db.collection('users').where({ username: username.trim() }).count()
			if (dup.total > 0) return fail('用户名已存在')
			const res = await db.collection('users').add({
				username: username.trim(),
				password,
				name: name.trim(),
				role,
				created_at: new Date()
			})
			return ok({ _id: res.id })
		} catch (e) {
			return fail(e.message)
		}
	},

	async update(params) {
		try {
			await checkRole(params.uid, ['admin'])
			const { _id, name, role, password } = params
			if (!_id) return fail('缺少用户ID')
			if (!['student', 'teacher', 'admin'].includes(role)) return fail('角色不合法')
			const data = { name: (name || '').trim(), role }
			// 密码留空则不修改
			if (password) data.password = password
			await db.collection('users').doc(_id).update(data)
			return ok()
		} catch (e) {
			return fail(e.message)
		}
	},

	async remove(params) {
		try {
			const admin = await checkRole(params.uid, ['admin'])
			if (params._id === admin._id) return fail('不能删除当前登录的管理员')
			await db.collection('users').doc(params._id).remove()
			return ok()
		} catch (e) {
			return fail(e.message)
		}
	}
}
