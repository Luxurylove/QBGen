'use strict';
const { db, ok, fail } = require('qb-common')

module.exports = {
	// 登录：用户名+密码校验，返回用户基本信息
	async login(params) {
		try {
			const { username, password } = params
			if (!username || !password) return fail('请输入账号和密码')
			const res = await db.collection('users')
				.where({ username: username.trim(), password })
				.limit(1)
				.get()
			if (!res.data.length) return fail('账号或密码错误')
			const u = res.data[0]
			return ok({ _id: u._id, username: u.username, name: u.name, role: u.role })
		} catch (e) {
			return fail(e.message)
		}
	},

	// 修改密码
	async changePassword(params) {
		try {
			const { uid, oldPassword, newPassword } = params
			if (!uid) return fail('请先登录')
			if (!newPassword || newPassword.length < 6) return fail('新密码至少6位')
			const res = await db.collection('users').doc(uid).get()
			if (!res.data.length) return fail('用户不存在')
			if (res.data[0].password !== oldPassword) return fail('原密码错误')
			await db.collection('users').doc(uid).update({ password: newPassword })
			return ok()
		} catch (e) {
			return fail(e.message)
		}
	}
}
