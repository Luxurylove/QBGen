'use strict';
// 演示数据初始化：幂等（先清空 8 个集合再写入种子数据）
const { db, ok, fail } = require('qb-common')
const _ = db.command

async function clearAll() {
	const collections = ['users', 'categories', 'questions', 'papers', 'exams', 'exam_records', 'practice_records', 'wrong_questions']
	for (const c of collections) {
		await db.collection(c).where({ _id: _.neq('') }).remove()
	}
}

async function addOne(coll, doc) {
	const res = await db.collection(coll).add(doc)
	return res.id
}

module.exports = {
	async run() {
		try {
			await clearAll()
			const now = Date.now()

			// 1. 用户
			const adminId = await addOne('users', { username: 'admin', password: 'admin123', name: '系统管理员', role: 'admin', created_at: new Date(now) })
			const teacherId = await addOne('users', { username: 'teacher1', password: '123456', name: '王老师', role: 'teacher', created_at: new Date(now) })
			const student1Id = await addOne('users', { username: 'student1', password: '123456', name: '张三', role: 'student', created_at: new Date(now) })
			await addOne('users', { username: 'student2', password: '123456', name: '李四', role: 'student', created_at: new Date(now) })

			// 2. 分类
			const catDS = await addOne('categories', { name: '数据结构', description: '线性表、树、图、查找与排序', sort: 1 })
			const catOS = await addOne('categories', { name: '操作系统', description: '进程管理、内存管理、文件系统', sort: 2 })
			const catNet = await addOne('categories', { name: '计算机网络', description: '体系结构、TCP/IP、应用层协议', sort: 3 })
			const catDB = await addOne('categories', { name: '数据库原理', description: '关系模型、SQL、规范化、事务', sort: 4 })

			// 3. 试题（34 道：单选12 / 多选6 / 判断8 / 填空4 / 简答4，覆盖 3 个难度）
			const O = (arr) => arr.map((t, i) => ({ key: String.fromCharCode(65 + i), text: t }))
			const qs = [
				// 单选 12
				{ c: catDS, type: 'single', d: 1, stem: '下列哪种数据结构具有先进先出（FIFO）的特点？', options: O(['栈', '队列', '二叉树', '图']), answer: 'B', analysis: '队列先进先出，栈先进后出。', score: 4 },
				{ c: catNet, type: 'single', d: 1, stem: 'OSI 参考模型共分为几层？', options: O(['5层', '6层', '7层', '8层']), answer: 'C', analysis: '物理、数据链路、网络、传输、会话、表示、应用共7层。', score: 4 },
				{ c: catDB, type: 'single', d: 1, stem: 'SQL 中用于查询数据的关键字是？', options: O(['INSERT', 'UPDATE', 'SELECT', 'DELETE']), answer: 'C', analysis: 'SELECT 用于数据查询。', score: 4 },
				{ c: catOS, type: 'single', d: 1, stem: '操作系统最基本的两个特征是？', options: O(['并发和共享', '虚拟和异步', '并行和共享', '并发和并行']), answer: 'A', analysis: '并发与共享是操作系统最基本的特征，二者互为存在条件。', score: 4 },
				{ c: catDS, type: 'single', d: 2, stem: '栈的存取特点是？', options: O(['先进先出', '后进先出', '随机存取', '按优先级存取']), answer: 'B', analysis: '栈是后进先出（LIFO）的线性表。', score: 4 },
				{ c: catNet, type: 'single', d: 2, stem: 'TCP 协议工作在 OSI 模型的哪一层？', options: O(['网络层', '传输层', '会话层', '应用层']), answer: 'B', analysis: 'TCP/UDP 属于传输层协议。', score: 4 },
				{ c: catDB, type: 'single', d: 2, stem: '关系数据库中，主键的主要作用是？', options: O(['提高查询速度', '唯一标识一条记录', '加密数据', '压缩存储']), answer: 'B', analysis: '主键唯一且非空，用于标识元组。', score: 4 },
				{ c: catOS, type: 'single', d: 2, stem: '进程与程序的主要区别是？', options: O(['进程是静态的', '程序是动态的', '进程是动态的，程序是静态的', '二者没有区别']), answer: 'C', analysis: '进程是程序的一次执行过程，具有动态性。', score: 4 },
				{ c: catDS, type: 'single', d: 3, stem: '对二叉排序树进行中序遍历，得到的序列是？', options: O(['升序序列', '降序序列', '随机序列', '层次序列']), answer: 'A', analysis: '二叉排序树左<根<右，中序遍历即升序。', score: 4 },
				{ c: catNet, type: 'single', d: 3, stem: '子网掩码 255.255.255.0 对应的 CIDR 前缀长度是？', options: O(['/8', '/16', '/24', '/32']), answer: 'C', analysis: '连续24个1，即 /24。', score: 4 },
				{ c: catDB, type: 'single', d: 3, stem: '事务 ACID 特性中，保证数据库从一个正确状态转变到另一个正确状态的是？', options: O(['原子性', '一致性', '隔离性', '持久性']), answer: 'B', analysis: '一致性保证事务执行前后数据库满足完整性约束。', score: 4 },
				{ c: catOS, type: 'single', d: 3, stem: '产生死锁的四个必要条件不包括？', options: O(['互斥条件', '请求与保持条件', '可剥夺条件', '循环等待条件']), answer: 'C', analysis: '应为"不可剥夺"条件，可剥夺则可破坏死锁。', score: 4 },
				// 多选 6
				{ c: catDS, type: 'multiple', d: 1, stem: '下列属于线性结构的有？', options: O(['数组', '链表', '栈', '图']), answer: ['A', 'B', 'C'], analysis: '图属于非线性结构。', score: 8 },
				{ c: catNet, type: 'multiple', d: 1, stem: '下列属于应用层协议的有？', options: O(['HTTP', 'FTP', 'TCP', 'DNS']), answer: ['A', 'B', 'D'], analysis: 'TCP 是传输层协议。', score: 8 },
				{ c: catDB, type: 'multiple', d: 2, stem: '下列属于关系型数据库管理系统的有？', options: O(['MySQL', 'Oracle', 'MongoDB', 'SQL Server']), answer: ['A', 'B', 'D'], analysis: 'MongoDB 是文档型 NoSQL 数据库。', score: 8 },
				{ c: catOS, type: 'multiple', d: 2, stem: '常见的进程调度算法有？', options: O(['先来先服务', '短作业优先', '时间片轮转', '随机调度']), answer: ['A', 'B', 'C'], analysis: '随机调度不是常用调度算法。', score: 8 },
				{ c: catDS, type: 'multiple', d: 3, stem: '关于哈希表，下列说法正确的有？', options: O(['通过哈希函数计算存储位置', '可能发生哈希冲突', '链地址法可解决冲突', '查找效率在任何情况下都是 O(1)']), answer: ['A', 'B', 'C'], analysis: '冲突严重时查找效率会退化。', score: 8 },
				{ c: catNet, type: 'multiple', d: 3, stem: '关于 TCP 与 UDP 的区别，正确的有？', options: O(['TCP 面向连接', 'UDP 提供可靠传输', 'TCP 具有拥塞控制', 'UDP 首部开销更小']), answer: ['A', 'C', 'D'], analysis: 'UDP 不保证可靠交付。', score: 8 },
				// 判断 8
				{ c: catDS, type: 'judge', d: 1, stem: '队列是一种先进后出的数据结构。', options: [], answer: '错', analysis: '队列是先进先出，栈才是先进后出。', score: 3 },
				{ c: catDB, type: 'judge', d: 1, stem: '在 SQL 中，WHERE 子句用于对查询结果进行分组。', options: [], answer: '错', analysis: '分组使用 GROUP BY，WHERE 用于行过滤。', score: 3 },
				{ c: catNet, type: 'judge', d: 1, stem: 'IPv4 地址由 32 位二进制数组成。', options: [], answer: '对', analysis: 'IPv4 地址长度为 32 位。', score: 3 },
				{ c: catOS, type: 'judge', d: 2, stem: '虚拟内存技术可以在逻辑上扩充内存容量。', options: [], answer: '对', analysis: '虚拟内存利用外存扩展逻辑地址空间。', score: 3 },
				{ c: catDS, type: 'judge', d: 2, stem: '满二叉树一定是完全二叉树。', options: [], answer: '对', analysis: '满二叉树满足完全二叉树的定义。', score: 3 },
				{ c: catNet, type: 'judge', d: 2, stem: 'HTTP 协议是一种无状态协议。', options: [], answer: '对', analysis: 'HTTP 本身不保存会话状态，需借助 Cookie/Session。', score: 3 },
				{ c: catDB, type: 'judge', d: 3, stem: '第三范式（3NF）要求消除非主属性对码的部分函数依赖。', options: [], answer: '错', analysis: '消除部分函数依赖是 2NF 的要求，3NF 消除传递依赖。', score: 3 },
				{ c: catOS, type: 'judge', d: 3, stem: '银行家算法是一种死锁避免算法。', options: [], answer: '对', analysis: '银行家算法通过安全序列判断避免进入不安全状态。', score: 3 },
				// 填空 4
				{ c: catDS, type: 'fill', d: 1, stem: '在具有 n 个结点的单链表中查找指定元素，最坏情况下的时间复杂度为____。', options: [], answer: 'O(n)', analysis: '单链表只能顺序查找。', score: 7 },
				{ c: catDB, type: 'fill', d: 2, stem: 'SQL 中使用 ____ 关键字去除查询结果中的重复行。', options: [], answer: 'DISTINCT', analysis: 'SELECT DISTINCT 去除重复元组。', score: 7 },
				{ c: catNet, type: 'fill', d: 2, stem: '域名系统 DNS 使用的默认端口号是 ____。', options: [], answer: '53', analysis: 'DNS 默认使用 UDP 53 端口。', score: 7 },
				{ c: catOS, type: 'fill', d: 3, stem: '页面置换算法中，选择最长时间未被访问的页面予以换出的算法简称是 ____。', options: [], answer: 'LRU', analysis: 'LRU（Least Recently Used）最近最久未使用算法。', score: 7 },
				// 简答 4
				{ c: catDS, type: 'essay', d: 1, stem: '简述顺序表和链表的主要区别及各自的适用场景。', options: [], answer: '顺序表：连续存储，支持随机存取，查询快（O(1)），但插入删除需移动元素（O(n)），适合读多写少、长度可预估的场景；链表：结点离散存储，插入删除快（O(1)），但只能顺序访问（O(n)），适合频繁插入删除、长度变化大的场景。', analysis: '从存储结构、访问方式、插入删除代价三方面作答。', score: 15 },
				{ c: catDB, type: 'essay', d: 2, stem: '什么是数据库事务？请说明事务的 ACID 特性。', options: [], answer: '事务是用户定义的一个数据库操作序列，这些操作要么全做要么全不做，是不可分割的工作单位。ACID：原子性（全部执行或全部不执行）、一致性（使数据库从一个一致状态变到另一个一致状态）、隔离性（并发事务互不干扰）、持久性（一旦提交，结果永久保存）。', analysis: '答出事务定义 4 分，ACID 每点约 3 分。', score: 15 },
				{ c: catNet, type: 'essay', d: 2, stem: '简述 TCP 三次握手建立连接的过程。', options: [], answer: '①客户端发送 SYN 报文（seq=x），进入 SYN_SENT 状态；②服务器收到后回复 SYN+ACK 报文（seq=y，ack=x+1），进入 SYN_RCVD 状态；③客户端再发送 ACK 报文（ack=y+1），双方进入 ESTABLISHED 状态，连接建立。三次握手是为了防止已失效的连接请求突然传到服务器造成资源浪费。', analysis: '三次报文交换过程每步 4 分，原因说明 3 分。', score: 15 },
				{ c: catDS, type: 'essay', d: 3, stem: '哈希表采用链地址法解决冲突时，影响哈希查找效率的主要因素有哪些？', options: [], answer: '①哈希函数的均匀性：函数分布越均匀，冲突越少；②装填因子 α=记录数/表长，α 越大冲突概率越高，链表越长，查找越慢；③冲突处理方法：链地址法下链表（或红黑树）的组织方式影响查找长度。综上，平均查找长度主要取决于装填因子与哈希函数质量。', analysis: '哈希函数、装填因子、冲突处理三方面各 5 分。', score: 15 }
			]

			const qids = {}
			for (let i = 0; i < qs.length; i++) {
				const q = qs[i]
				const id = await addOne('questions', {
					category_id: q.c,
					type: q.type,
					difficulty: q.d,
					stem: q.stem,
					options: q.options,
					answer: q.answer,
					analysis: q.analysis,
					score: q.score,
					created_by: teacherId,
					created_at: new Date(now)
				})
				qids[i] = { id, type: q.type }
			}

			// 4. 试卷（单选5×4 + 多选3×8 + 判断4×3 + 填空2×7 + 简答2×15 = 100）
			const pick = (type, idxs) => idxs.map(i => ({ question_id: qids[i].id, score: qs[i].score }))
			const paperQuestions = [
				...pick('single', [0, 1, 2, 3, 4]),
				...pick('multiple', [12, 13, 14]),
				...pick('judge', [18, 19, 20, 21]),
				...pick('fill', [27, 28]),
				...pick('essay', [31, 32])
			]
			const totalScore = paperQuestions.reduce((s, q) => s + q.score, 0)
			const paperId = await addOne('papers', {
				title: '计算机基础期末模拟卷',
				questions: paperQuestions,
				total_score: totalScore,
				duration: 90,
				pass_score: 60,
				gen_config: { mode: 'manual', remark: '初始化演示试卷' },
				created_by: teacherId,
				created_at: new Date(now)
			})

			// 5. 考试（长期开放，便于演示）
			await addOne('exams', {
				paper_id: paperId,
				title: '2026年计算机基础期末考试',
				start_time: new Date(now - 365 * 24 * 3600 * 1000),
				end_time: new Date(now + 365 * 24 * 3600 * 1000),
				status: 'published',
				created_by: teacherId,
				created_at: new Date(now)
			})

			return ok({ users: 4, categories: 4, questions: qs.length, papers: 1, exams: 1 })
		} catch (e) {
			return fail(e.message)
		}
	}
}
