'use strict';
const { db, ok, fail, checkRole, isCorrect, shuffle } = require('qb-common')
const _ = db.command

module.exports = {
	// 按条件随机抽题练习：剔除简答题与敏感字段
	async getQuestions(params) {
		try {
			await checkRole(params.uid, ['student'])
			const where = { type: _.neq('essay') }
			if (params.category_id) where.category_id = params.category_id
			if (params.type) where.type = params.type
			if (params.difficulty) where.difficulty = Number(params.difficulty)
			const qRes = await db.collection('questions').where(where).limit(200).get()
			const count = Math.min(Math.max(Number(params.count) || 5, 1), 20)
			const picked = shuffle(qRes.data).slice(0, count)
			picked.forEach(q => {
				delete q.answer
				delete q.analysis
			})
			return ok(picked)
		} catch (e) {
			return fail(e.message)
		}
	},

	// 提交单题作答：判分、写练习记录、维护错题本
	async submit(params) {
		try {
			const user = await checkRole(params.uid, ['student'])
			const qRes = await db.collection('questions').doc(params.question_id).get()
			if (!qRes.data.length) return fail('题目不存在')
			const q = qRes.data[0]
			const right = isCorrect(q.type, params.user_answer, q.answer)
			await db.collection('practice_records').add({
				student_id: user._id,
				question_id: q._id,
				user_answer: params.user_answer === undefined ? '' : params.user_answer,
				is_correct: right,
				created_at: new Date()
			})
			const wCol = db.collection('wrong_questions')
			const wRes = await wCol.where({ student_id: user._id, question_id: q._id }).get()
			if (!right) {
				// 答错：错题本累计次数
				if (wRes.data.length) {
					await wCol.doc(wRes.data[0]._id).update({
						wrong_count: _.inc(1),
						last_wrong_at: new Date()
					})
				} else {
					await wCol.add({
						student_id: user._id,
						question_id: q._id,
						wrong_count: 1,
						last_wrong_at: new Date()
					})
				}
			} else if (wRes.data.length) {
				// 答对：移出错题本
				await wCol.doc(wRes.data[0]._id).remove()
			}
			return ok({
				is_correct: right,
				answer: q.answer,
				analysis: q.analysis || ''
			})
		} catch (e) {
			return fail(e.message)
		}
	},

	// 错题本列表：联查题目内容与分类
	async listWrong(params) {
		try {
			const user = await checkRole(params.uid, ['student'])
			const wRes = await db.collection('wrong_questions')
				.where({ student_id: user._id }).orderBy('last_wrong_at', 'desc').limit(100).get()
			if (!wRes.data.length) return ok([])
			const ids = wRes.data.map(w => w.question_id)
			const qRes = await db.collection('questions').where({ _id: _.in(ids) }).get()
			const qMap = {}
			qRes.data.forEach(q => { qMap[q._id] = q })
			const list = wRes.data
				.filter(w => qMap[w.question_id])
				.map(w => ({
					_id: w._id,
					question_id: w.question_id,
					wrong_count: w.wrong_count,
					last_wrong_at: w.last_wrong_at,
					question: qMap[w.question_id]
				}))
			return ok(list)
		} catch (e) {
			return fail(e.message)
		}
	}
}
