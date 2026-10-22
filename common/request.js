// 云对象调用封装：统一注入 uid，统一处理 code/msg 返回约定与错误提示
export function call(objName, method, payload = {}) {
	// 净化 payload：去掉 Vue3 响应式 proxy，避免 uniCloud 序列化异常
	const cleanPayload = JSON.parse(JSON.stringify(payload || {}))
	return new Promise((resolve, reject) => {
		uniCloud.callFunction({
			name: objName,
			data: {
				method,
				// 云对象协议要求 params 必须是「位置参数数组」，
				// 云端会以 method(...params) 展开调用，传普通对象会触发
				// TypeError: Found non-callable @@iterator
				params: [{
					...cleanPayload,
					uid: uni.getStorageSync('uid') || ''
				}]
			},
			success: (res) => {
				const r = res.result
				if (r && r.code === 0) {
					resolve(r.data)
				} else {
					const msg = (r && r.msg) || '请求失败'
					uni.showToast({ title: msg, icon: 'none' })
					reject(new Error(msg))
				}
			},
			fail: (err) => {
				// 输出真实错误到控制台，便于排查
				console.error('[云函数调用失败]', objName, method, err)
				const detail = (err && err.errMsg) || (err && err.message) || ''
				const msg = detail ? `云服务异常：${detail}` : '网络或云服务异常'
				uni.showToast({ title: msg, icon: 'none' })
				reject(err)
			}
		})
	})
}
