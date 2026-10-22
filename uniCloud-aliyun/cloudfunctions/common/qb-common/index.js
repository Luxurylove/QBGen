// 云对象公共模块：鉴权 + 统一返回格式 + 判分工具
const db = uniCloud.database()

// 统一成功返回
function ok(data = null) {
	return { code: 0, data }
}

// 统一失败返回
function fail(msg = '操作失败') {
	return { code: 1, msg }
}

// 校验登录与角色，返回用户记录；不合法则抛错
async function checkRole(uid, roles = []) {
	if (!uid) throw new Error('请先登录')
	const res = await db.collection('users').doc(uid).get()
	if (!res.data || res.data.length === 0) throw new Error('用户不存在，请重新登录')
	const user = res.data[0]
	if (roles.length && !roles.includes(user.role)) throw new Error('无权执行该操作')
	return user
}

// 判断客观题作答是否正确
// type: single/judge 为字符串比对；multiple 为数组集合比对；fill 为去空格小写文本比对
function isCorrect(type, userAnswer, rightAnswer) {
	if (userAnswer === undefined || userAnswer === null || userAnswer === '') return false
	if (type === 'single' || type === 'judge') {
		return String(userAnswer).trim() === String(rightAnswer).trim()
	}
	if (type === 'multiple') {
		if (!Array.isArray(userAnswer) || !Array.isArray(rightAnswer)) return false
		if (userAnswer.length !== rightAnswer.length) return false
		const a = [...userAnswer].sort()
		const b = [...rightAnswer].sort()
		return a.every((v, i) => v === b[i])
	}
	if (type === 'fill') {
		return String(userAnswer).replace(/\s/g, '').toLowerCase() ===
			String(rightAnswer).replace(/\s/g, '').toLowerCase()
	}
	return false
}

// Fisher-Yates 洗牌
function shuffle(arr) {
	const a = [...arr]
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[a[i], a[j]] = [a[j], a[i]]
	}
	return a
}

const TYPE_TEXT = { single: '单选题', multiple: '多选题', judge: '判断题', fill: '填空题', essay: '简答题' }
const DIFF_TEXT = { 1: '简单', 2: '中等', 3: '困难' }

module.exports = { db, ok, fail, checkRole, isCorrect, shuffle, TYPE_TEXT, DIFF_TEXT }
