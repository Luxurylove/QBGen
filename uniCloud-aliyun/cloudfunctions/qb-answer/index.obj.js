'use strict';
const { db, ok, fail, checkRole, isCorrect } = require('qb-common')
const _ = db.command

// 校验考试可参加：存在、已发布、在时间窗内
async function checkExamAvailable(examId, studentId) {
	const eRes = await db.collection('exams').doc(examId).get()
	if (!eRes.data.length) throw new Error('考试不存在')
	const exam = eRes.data[0]
	if (exam.status !== 'published') throw new Error('考试已关闭')
	const now = Date.now()
	if (now < new Date(exam.start_time).getTime()) throw new Error('考试尚未开始')
	if (now > new Date(exam.end_time).getTime()) throw new Error('考试已结束')
	const dup = await db.collection('exam_records')
		.where({ exam_id: examId, student_id: studentId }).count()
	if (dup.total > 0) throw new Error('您已参加过本次考试')
	return exam
}

module.exports = {
	// 学生取卷：剔除答案与解析字段，防止作弊
	async getPaper(params) {
		try {
			const user = await checkRole(params.uid, ['student'])
			const exam = await checkExamAvailable(params.exam_id, user._id)
			const pRes = await db.collection('papers').doc(exam.paper_id).get()
			if (!pRes.data.length) throw new Error('试卷不存在')
			const paper = pRes.data[0]
			const ids = paper.questions.map(q => q.question_id)
			const qRes = await db.collection('questions').where({ _id: _.in(ids) }).get()
			const qMap = {}
			qRes.data.forEach(q => {
				// 关键：删除敏感字段后再下发
				delete q.answer
				delete q.analysis
				qMap[q._id] = q
			})
			const questions = paper.questions
				.map(x => ({ question_id: x.question_id, score: x.score, question: qMap[x.question_id] }))
				.filter(x => x.question)
			return ok({
				exam_id: exam._id,
				exam_title: exam.title,
				title: paper.title,
				duration: paper.duration,
				total_score: paper.total_score,
				pass_score: paper.pass_score,
				questions
			})
		} catch (e) {
			return fail(e.message)
		}
	},

	// 交卷：服务端重新取标准答案判分，客观题自动评分
	async submit(params) {
		try {
			const user = await checkRole(params.uid, ['student'])
			const exam = await checkExamAvailable(params.exam_id, user._id)
			const answers = Array.isArray(params.answers) ? params.answers : []

			const pRes = await db.collection('papers').doc(exam.paper_id).get()
			if (!pRes.data.length) throw new Error('试卷不存在')
			const paper = pRes.data[0]
			const ids = paper.questions.map(q => q.question_id)
			const qRes = await db.collection('questions').where({ _id: _.in(ids) }).get()
			const qMap = {}
			qRes.data.forEach(q => { qMap[q._id] = q })
			const ansMap = {}
			answers.forEach(a => { ansMap[a.question_id] = a.user_answer })

			let objectiveScore = 0
			let hasEssay = false
			const gradedAnswers = paper.questions.map(x => {
				const q = qMap[x.question_id]
				const ua = ansMap[x.question_id]
				const item = { question_id: x.question_id, user_answer: ua === undefined ? '' : ua, score: 0 }
				if (!q) return item
				if (q.type === 'essay') {
					hasEssay = true
				} else if (isCorrect(q.type, ua, q.answer)) {
					item.score = x.score
					objectiveScore += x.score
				}
				return item
			})

			const record = {
				exam_id: exam._id,
				paper_id: paper._id,
				student_id: user._id,
				answers: gradedAnswers,
				objective_score: objectiveScore,
				subjective_score: 0,
				total_score: objectiveScore,
				status: hasEssay ? 'submitted' : 'graded',
				comment: '',
				submit_time: new Date()
			}
			const addRes = await db.collection('exam_records').add(record)
			return ok({
				record_id: addRes.id,
				objective_score: objectiveScore,
				need_grading: hasEssay
			})
		} catch (e) {
			return fail(e.message)
		}
	},

	// 我的成绩列表
	async myRecords(params) {
		try {
			const user = await checkRole(params.uid, ['student'])
			const rRes = await db.collection('exam_records')
				.where({ student_id: user._id }).orderBy('submit_time', 'desc').get()
			if (!rRes.data.length) return ok([])
			const examIds = rRes.data.map(r => r.exam_id)
			const paperIds = rRes.data.map(r => r.paper_id)
			const [eRes, pRes] = await Promise.all([
				db.collection('exams').where({ _id: _.in(examIds) }).get(),
				db.collection('papers').where({ _id: _.in(paperIds) }).get()
			])
			const eMap = {}, pMap = {}
			eRes.data.forEach(e => { eMap[e._id] = e })
			pRes.data.forEach(p => { pMap[p._id] = p })
			const list = rRes.data.map(r => ({
				_id: r._id,
				exam_id: r.exam_id,
				exam_title: eMap[r.exam_id] ? eMap[r.exam_id].title : '考试已删除',
				paper_title: pMap[r.paper_id] ? pMap[r.paper_id].title : '',
				paper_total: pMap[r.paper_id] ? pMap[r.paper_id].total_score : 0,
				pass_score: pMap[r.paper_id] ? pMap[r.paper_id].pass_score : 0,
				status: r.status,
				objective_score: r.objective_score,
				total_score: r.total_score,
				submit_time: r.submit_time
			}))
			return ok(list)
		} catch (e) {
			return fail(e.message)
		}
	},

	// 我的答卷详情：已出分时返回标准答案与解析供回顾；待阅卷时不下发答案
	async myResult(params) {
		try {
			const user = await checkRole(params.uid, ['student'])
			const rRes = await db.collection('exam_records').doc(params.record_id).get()
			if (!rRes.data.length) return fail('答卷不存在')
			const record = rRes.data[0]
			if (record.student_id !== user._id) return fail('只能查看自己的答卷')

			const pRes = await db.collection('papers').doc(record.paper_id).get()
			const paper = pRes.data[0]
			const eRes = await db.collection('exams').doc(record.exam_id).get()
			const exam = eRes.data[0]

			const ids = paper.questions.map(q => q.question_id)
			const qRes = await db.collection('questions').where({ _id: _.in(ids) }).get()
			const qMap = {}
			qRes.data.forEach(q => {
				if (record.status !== 'graded') {
					delete q.answer
					delete q.analysis
				}
				qMap[q._id] = q
			})
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
				pass_score: paper.pass_score,
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
	}
}
