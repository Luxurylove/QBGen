'use strict';
const { db, ok, fail, checkRole } = require('qb-common')
const _ = db.command

module.exports = {
	// 考试列表（教师/管理员，含试卷信息与交卷人数）
	async list(params) {
		try {
			await checkRole(params.uid, ['teacher', 'admin'])
			const res = await db.collection('exams').orderBy('created_at', 'desc').get()
			const paperIds = res.data.map(e => e.paper_id)
			let paperMap = {}
			if (paperIds.length) {
				const pRes = await db.collection('papers').where({ _id: _.in(paperIds) }).get()
				pRes.data.forEach(p => { paperMap[p._id] = p })
			}
			for (const e of res.data) {
				const p = paperMap[e.paper_id]
				e.paper_title = p ? p.title : '试卷已删除'
				e.total_score = p ? p.total_score : 0
				e.duration = p ? p.duration : 0
				const c = await db.collection('exam_records').where({ exam_id: e._id }).count()
				e.submit_count = c.total
			}
			return ok(res.data)
		} catch (e) {
			return fail(e.message)
		}
	},

	// 学生可见考试列表（含本人作答状态）
	async listForStudent(params) {
		try {
			const user = await checkRole(params.uid, ['student'])
			const res = await db.collection('exams').where({ status: 'published' }).orderBy('start_time', 'desc').get()
			const paperIds = res.data.map(e => e.paper_id)
			let paperMap = {}
			if (paperIds.length) {
				const pRes = await db.collection('papers').where({ _id: _.in(paperIds) }).get()
				pRes.data.forEach(p => { paperMap[p._id] = p })
			}
			const rRes = await db.collection('exam_records').where({ student_id: user._id }).get()
			const myMap = {}
			rRes.data.forEach(r => { myMap[r.exam_id] = r })
			const now = Date.now()
			const list = res.data.map(e => {
				const p = paperMap[e.paper_id] || {}
				const my = myMap[e._id]
				let phase = 'ongoing'
				if (now < new Date(e.start_time).getTime()) phase = 'notStarted'
				else if (now > new Date(e.end_time).getTime()) phase = 'ended'
				return {
					_id: e._id,
					title: e.title,
					start_time: e.start_time,
					end_time: e.end_time,
					total_score: p.total_score || 0,
					duration: p.duration || 0,
					pass_score: p.pass_score || 0,
					question_count: p.questions ? p.questions.length : 0,
					phase,
					my_status: my ? my.status : '',
					my_score: my ? my.total_score : null
				}
			})
			return ok(list)
		} catch (e) {
			return fail(e.message)
		}
	},

	// 发布考试
	async create(params) {
		try {
			const user = await checkRole(params.uid, ['teacher', 'admin'])
			const { paper_id, title, start_time, end_time } = params
			if (!paper_id) return fail('请选择试卷')
			if (!title || !title.trim()) return fail('请输入考试名称')
			if (!start_time || !end_time) return fail('请设置起止时间')
			if (new Date(end_time) <= new Date(start_time)) return fail('结束时间必须晚于开始时间')
			const res = await db.collection('exams').add({
				paper_id,
				title: title.trim(),
				start_time: new Date(start_time),
				end_time: new Date(end_time),
				status: 'published',
				created_by: user._id,
				created_at: new Date()
			})
			return ok({ _id: res.id })
		} catch (e) {
			return fail(e.message)
		}
	},

	// 编辑考试（时间/名称/关闭）
	async update(params) {
		try {
			await checkRole(params.uid, ['teacher', 'admin'])
			const { _id, title, start_time, end_time, status } = params
			if (!_id) return fail('缺少考试ID')
			const data = {}
			if (title) data.title = title.trim()
			if (start_time) data.start_time = new Date(start_time)
			if (end_time) data.end_time = new Date(end_time)
			if (status) data.status = status
			if (data.start_time && data.end_time && data.end_time <= data.start_time) {
				return fail('结束时间必须晚于开始时间')
			}
			await db.collection('exams').doc(_id).update(data)
			return ok()
		} catch (e) {
			return fail(e.message)
		}
	},

	// 删除考试（已有交卷记录的不允许删除）
	async remove(params) {
		try {
			await checkRole(params.uid, ['teacher', 'admin'])
			if (!params._id) return fail('缺少考试ID')
			const used = await db.collection('exam_records').where({ exam_id: params._id }).count()
			if (used.total > 0) return fail('已有学生交卷，不能删除')
			await db.collection('exams').doc(params._id).remove()
			return ok()
		} catch (e) {
			return fail(e.message)
		}
	}
}
