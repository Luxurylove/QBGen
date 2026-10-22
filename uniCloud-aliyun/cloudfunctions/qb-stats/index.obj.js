'use strict';
const { db, ok, fail, checkRole, TYPE_TEXT, DIFF_TEXT } = require('qb-common')
const _ = db.command
const $ = _.aggregate

module.exports = {
	// 系统总览：各集合数量 + 按角色/题型/难度聚合
	async overview(params) {
		try {
			await checkRole(params.uid, ['admin'])
			const [users, categories, questions, papers, exams, records] = await Promise.all([
				db.collection('users').count(),
				db.collection('categories').count(),
				db.collection('questions').count(),
				db.collection('papers').count(),
				db.collection('exams').count(),
				db.collection('exam_records').count()
			])
			// 按角色统计用户
			const roleRes = await db.collection('users').aggregate()
				.group({ _id: '$role', count: $.sum(1) }).end()
			const roleStats = roleRes.data.map(r => ({
				role: r._id, count: r.count
			}))
			// 按题型统计题目
			const typeRes = await db.collection('questions').aggregate()
				.group({ _id: '$type', count: $.sum(1) }).end()
			const typeStats = typeRes.data.map(r => ({
				type: r._id, type_text: TYPE_TEXT[r._id] || r._id, count: r.count
			}))
			// 按难度统计题目
			const diffRes = await db.collection('questions').aggregate()
				.group({ _id: '$difficulty', count: $.sum(1) }).end()
			const diffStats = diffRes.data.map(r => ({
				difficulty: r._id, diff_text: DIFF_TEXT[r._id] || r._id, count: r.count
			}))
			return ok({
				counts: {
					users: users.total,
					categories: categories.total,
					questions: questions.total,
					papers: papers.total,
					exams: exams.total,
					exam_records: records.total
				},
				roleStats, typeStats, diffStats
			})
		} catch (e) {
			return fail(e.message)
		}
	},

	// 成绩统计：各考试的平均分、及格率、分数段分布（仅已出分）
	async scoreStats(params) {
		try {
			await checkRole(params.uid, ['admin'])
			const rRes = await db.collection('exam_records')
				.where({ status: 'graded' }).limit(500).get()
			if (!rRes.data.length) return ok([])
			const examIds = [...new Set(rRes.data.map(r => r.exam_id))]
			const paperIds = [...new Set(rRes.data.map(r => r.paper_id))]
			const [eRes, pRes] = await Promise.all([
				db.collection('exams').where({ _id: _.in(examIds) }).get(),
				db.collection('papers').where({ _id: _.in(paperIds) }).get()
			])
			const eMap = {}, pMap = {}
			eRes.data.forEach(e => { eMap[e._id] = e })
			pRes.data.forEach(p => { pMap[p._id] = p })
			const groups = {}
			rRes.data.forEach(r => {
				if (!groups[r.exam_id]) groups[r.exam_id] = []
				groups[r.exam_id].push(r)
			})
			const list = Object.keys(groups).map(examId => {
				const rows = groups[examId]
				const paper = pMap[rows[0].paper_id]
				const passScore = paper ? paper.pass_score : 60
				const totalScore = paper ? paper.total_score : 100
				const sum = rows.reduce((s, r) => s + r.total_score, 0)
				const passCount = rows.filter(r => r.total_score >= passScore).length
				// 分数段：<60 / 60-69 / 70-79 / 80-89 / 90+（按百分制折算）
				const bands = [0, 0, 0, 0, 0]
				rows.forEach(r => {
					const pct = totalScore > 0 ? (r.total_score / totalScore) * 100 : 0
					if (pct < 60) bands[0]++
					else if (pct < 70) bands[1]++
					else if (pct < 80) bands[2]++
					else if (pct < 90) bands[3]++
					else bands[4]++
				})
				return {
					exam_id: examId,
					exam_title: eMap[examId] ? eMap[examId].title : '考试已删除',
					count: rows.length,
					avg_score: Math.round((sum / rows.length) * 10) / 10,
					pass_rate: Math.round((passCount / rows.length) * 100),
					bands
				}
			})
			return ok(list)
		} catch (e) {
			return fail(e.message)
		}
	}
}
