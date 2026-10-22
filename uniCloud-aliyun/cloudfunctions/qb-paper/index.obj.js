'use strict';
const { db, ok, fail, checkRole, shuffle, TYPE_TEXT, DIFF_TEXT } = require('qb-common')
const _ = db.command

module.exports = {
	// ================= 自动组卷核心算法 =================
	// 输入 rules: [{ type, difficulty(0=随机), count, score }]，category_ids 可选限定范围
	// 算法：按(题型×难度)分桶取候选集 → Fisher-Yates 洗牌 → 取前 N 道
	// 任一条件题量不足时返回 shortages 缺额明细，不静默凑数
	async autoGen(params) {
		try {
			await checkRole(params.uid, ['teacher', 'admin'])
			const rules = Array.isArray(params.rules) ? params.rules : []
			const categoryIds = Array.isArray(params.category_ids) ? params.category_ids : []
			if (!rules.length) return fail('请设置组卷条件')

			const picked = []
			const shortages = []
			const usedIds = new Set()

			for (const r of rules) {
				const count = Number(r.count) || 0
				if (count <= 0) continue
				const where = { type: r.type }
				if (Number(r.difficulty) > 0) where.difficulty = Number(r.difficulty)
				if (categoryIds.length) where.category_id = _.in(categoryIds)
				const res = await db.collection('questions').where(where).get()
				// 剔除已被前序条件抽中的题，避免重复
				let pool = shuffle(res.data.filter(q => !usedIds.has(q._id)))
				if (pool.length < count) {
					shortages.push({
						label: `${TYPE_TEXT[r.type]}（${Number(r.difficulty) > 0 ? DIFF_TEXT[r.difficulty] : '随机难度'}）`,
						need: count,
						have: pool.length
					})
				}
				pool = pool.slice(0, Math.min(count, pool.length))
				pool.forEach(q => {
					usedIds.add(q._id)
					picked.push({ question_id: q._id, score: Number(r.score) || q.score || 0, question: q })
				})
			}

			const totalScore = picked.reduce((s, x) => s + x.score, 0)
			return ok({ questions: picked, total_score: totalScore, shortages })
		} catch (e) {
			return fail(e.message)
		}
	},

	// 保存试卷（组卷结果落库，附组卷条件快照）
	async save(params) {
		try {
			const user = await checkRole(params.uid, ['teacher', 'admin'])
			const { title, duration = 60, pass_score = 60, questions = [], gen_config = {} } = params
			if (!title || !title.trim()) return fail('请输入试卷标题')
			if (!questions.length) return fail('试卷不能为空')
			const list = questions.map(q => ({ question_id: q.question_id, score: Number(q.score) || 0 }))
			const totalScore = list.reduce((s, q) => s + q.score, 0)
			const res = await db.collection('papers').add({
				title: title.trim(),
				questions: list,
				total_score: totalScore,
				duration: Number(duration) || 60,
				pass_score: Number(pass_score) || 60,
				gen_config,
				created_by: user._id,
				created_at: new Date()
			})
			return ok({ _id: res.id, total_score: totalScore })
		} catch (e) {
			return fail(e.message)
		}
	},

	// 试卷列表
	async list(params) {
		try {
			await checkRole(params.uid, ['teacher', 'admin'])
			const res = await db.collection('papers').orderBy('created_at', 'desc').get()
			return ok(res.data)
		} catch (e) {
			return fail(e.message)
		}
	},

	// 试卷详情（联查题目完整内容，教师视角含答案）
	async detail(params) {
		try {
			await checkRole(params.uid, ['teacher', 'admin'])
			const res = await db.collection('papers').doc(params._id).get()
			if (!res.data.length) return fail('试卷不存在')
			const paper = res.data[0]
			const ids = paper.questions.map(q => q.question_id)
			const qRes = await db.collection('questions').where({ _id: _.in(ids) }).get()
			const qMap = {}
			qRes.data.forEach(q => { qMap[q._id] = q })
			paper.questions = paper.questions.map(x => ({ ...x, question: qMap[x.question_id] || null }))
			return ok(paper)
		} catch (e) {
			return fail(e.message)
		}
	},

	// 删除试卷（已被考试引用的不允许删除）
	async remove(params) {
		try {
			await checkRole(params.uid, ['teacher', 'admin'])
			if (!params._id) return fail('缺少试卷ID')
			const used = await db.collection('exams').where({ paper_id: params._id }).count()
			if (used.total > 0) return fail('该试卷已用于考试，不能删除')
			await db.collection('papers').doc(params._id).remove()
			return ok()
		} catch (e) {
			return fail(e.message)
		}
	}
}
