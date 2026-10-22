'use strict';
const { db, ok, fail, checkRole } = require('qb-common')
const _ = db.command

module.exports = {
	// 阅卷列表：联查考试、试卷、学生；可按考试与状态过滤
	async list(params) {
		try {
			await checkRole(params.uid, ['teacher', 'admin'])
			const where = {}
			if (params.exam_id) where.exam_id = params.exam_id
			if (params.status) where.status = params.status
			const rRes = await db.collection('exam_records')
				.where(where).orderBy('submit_time', 'desc').limit(200).get()
			if (!rRes.data.length) return ok([])
			const examIds = [...new Set(rRes.data.map(r => r.exam_id))]
			const paperIds = [...new Set(rRes.data.map(r => r.paper_id))]
			const stuIds = [...new Set(rRes.data.map(r => r.student_id))]
			const [eRes, pRes, uRes] = await Promise.all([
				db.collection('exams').where({ _id: _.in(examIds) }).get(),
				db.collection('papers').where({ _id: _.in(paperIds) }).get(),
				db.collection('users').where({ _id: _.in(stuIds) }).field({ name: 1, username: 1 }).get()
			])
			const eMap = {}, pMap = {}, uMap = {}
			eRes.data.forEach(e => { eMap[e._id] = e })
			pRes.data.forEach(p => { pMap[p._id] = p })
			uRes.data.forEach(u => { uMap[u._id] = u })
			const list = rRes.data.map(r => ({
				_id: r._id,
				exam_id: r.exam_id,
				exam_title: eMap[r.exam_id] ? eMap[r.exam_id].title : '考试已删除',
				paper_title: pMap[r.paper_id] ? pMap[r.paper_id].title : '',
				paper_total: pMap[r.paper_id] ? pMap[r.paper_id].total_score : 0,
				student_name: uMap[r.student_id] ? uMap[r.student_id].name : '学生已删除',
				student_username: uMap[r.student_id] ? uMap[r.student_id].username : '',
				status: r.status,
				objective_score: r.objective_score,
				subjective_score: r.subjective_score,
				total_score: r.total_score,
				submit_time: r.submit_time
			}))
			return ok(list)
		} catch (e) {
			return fail(e.message)
		}
	},

	// 答卷详情（教师视角，含标准答案与解析）
	async detail(params) {
		try {
			await checkRole(params.uid, ['teacher', 'admin'])
			const rRes = await db.collection('exam_records').doc(params.record_id).get()
			if (!rRes.data.length) return fail('答卷不存在')
			const record = rRes.data[0]
			const [pRes, eRes, uRes] = await Promise.all([
				db.collection('papers').doc(record.paper_id).get(),
				db.collection('exams').doc(record.exam_id).get(),
				db.collection('users').doc(record.student_id).field({ name: 1, username: 1 }).get()
			])
			if (!pRes.data.length) return fail('试卷不存在')
			const paper = pRes.data[0]
			const exam = eRes.data[0]
			const student = uRes.data[0]
			const ids = paper.questions.map(q => q.question_id)
			const qRes = await db.collection('questions').where({ _id: _.in(ids) }).get()
			const qMap = {}
			qRes.data.forEach(q => { qMap[q._id] = q })
			const ansMap = {}
			record.answers.forEach(a => { ansMap[a.question_id] = a })
			const questions = paper.questions.map(x => ({
				question_id: x.question_id,
				score: x.score,
				question: qMap[x.question_id] || null,
				user_answer: ansMap[x.question_id] ? ansMap[x.question_id].user_answer : '',
				got_score: ansMap[x.question_id] ? ansMap[x.question_id].score : 0
			}))
			return ok({
				_id: record._id,
				exam_title: exam ? exam.title : '',
				paper_title: paper.title,
				paper_total: paper.total_score,
				student_name: student ? student.name : '学生已删除',
				student_username: student ? student.username : '',
				status: record.status,
				objective_score: record.objective_score,
				subjective_score: record.subjective_score,
				total_score: record.total_score,
				comment: record.comment || '',
				submit_time: record.submit_time,
				questions
			})
		} catch (e) {
			return fail(e.message)
		}
	},

	// 主观题打分：写每题得分、合计总分、置为已出分
	async grade(params) {
		try {
			const user = await checkRole(params.uid, ['teacher', 'admin'])
			const rRes = await db.collection('exam_records').doc(params.record_id).get()
			if (!rRes.data.length) return fail('答卷不存在')
			const record = rRes.data[0]
			const scores = params.scores || {}
			const answers = record.answers.map(a => {
				if (Object.prototype.hasOwnProperty.call(scores, a.question_id)) {
					const s = Number(scores[a.question_id])
					if (isNaN(s) || s < 0) throw new Error('得分必须是不小于0的数字')
					return { ...a, score: Math.round(s) }
				}
				return a
			})
			// 校验主观题得分不超过题目满分
			const pRes = await db.collection('papers').doc(record.paper_id).get()
			if (!pRes.data.length) return fail('试卷不存在')
			const fullMap = {}
			pRes.data[0].questions.forEach(x => { fullMap[x.question_id] = x.score })
			for (const a of answers) {
				if (fullMap[a.question_id] !== undefined && a.score > fullMap[a.question_id]) {
					throw new Error('单题得分不能超过题目满分')
				}
			}
			const totalScore = answers.reduce((sum, a) => sum + a.score, 0)
			// 客观题得分交卷时已固定，总分减去客观题分即为主观题分
			const subjectiveScore = totalScore - record.objective_score
			await db.collection('exam_records').doc(record._id).update({
				answers,
				subjective_score: subjectiveScore,
				total_score: totalScore,
				status: 'graded',
				comment: params.comment || '',
				graded_by: user._id,
				graded_at: new Date()
			})
			return ok({ total_score: totalScore })
		} catch (e) {
			return fail(e.message)
		}
	}
}
