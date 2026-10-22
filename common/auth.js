// 登录态管理：基于 uni.storage
export function setUser(u) {
	uni.setStorageSync('uid', u._id)
	uni.setStorageSync('username', u.username)
	uni.setStorageSync('name', u.name)
	uni.setStorageSync('role', u.role)
}

export function getUser() {
	return {
		uid: uni.getStorageSync('uid') || '',
		username: uni.getStorageSync('username') || '',
		name: uni.getStorageSync('name') || '',
		role: uni.getStorageSync('role') || ''
	}
}

export function clearUser() {
	;['uid', 'username', 'name', 'role'].forEach(k => uni.removeStorageSync(k))
}

export function requireLogin() {
	if (!uni.getStorageSync('uid')) {
		uni.reLaunch({ url: '/pages/login/login' })
		return false
	}
	return true
}

export const ROLE_TEXT = { student: '学生', teacher: '教师', admin: '管理员' }
