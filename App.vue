<script>
	export default {
		onLaunch: function() {},
		onShow: function() {},
		onHide: function() {}
	}
</script>

<style>
	page {
		background-color: #F4F6FA;
		font-size: 28rpx;
		color: #303133;
	}

	/* ========== 卡片 ========== */
	.card {
		background: #ffffff;
		border-radius: 12rpx;
		padding: 28rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
		box-sizing: border-box;
	}

	/* ========== 按钮 ========== */
	.btn-primary {
		background: linear-gradient(135deg, #3B7CFF, #5A8DFF);
		color: #ffffff;
		border-radius: 10rpx;
		font-size: 28rpx;
		border: none;
		line-height: 1.9;
		padding: 0 32rpx;
	}

	.btn-plain {
		background: #ffffff;
		color: #3B7CFF;
		border: 1rpx solid #3B7CFF;
		border-radius: 10rpx;
		font-size: 28rpx;
		line-height: 1.9;
		padding: 0 32rpx;
	}

	.btn-danger {
		background: #ffffff;
		color: #F56C6C;
		border: 1rpx solid #F56C6C;
		border-radius: 10rpx;
		font-size: 28rpx;
		line-height: 1.9;
		padding: 0 32rpx;
	}

	.btn-sm {
		font-size: 24rpx !important;
		line-height: 1.8 !important;
		padding: 0 22rpx !important;
	}

	.btn-block {
		width: 100%;
	}

	.btn-primary,
	.btn-plain,
	.btn-danger {
		cursor: pointer;
	}

	button[disabled] {
		opacity: 0.55;
	}

	button::after {
		border: none;
	}

	/* ========== 标签 ========== */
	.tag {
		display: inline-flex;
		align-items: center;
		padding: 4rpx 16rpx;
		border-radius: 6rpx;
		font-size: 22rpx;
		margin-right: 10rpx;
		line-height: 1.6;
	}

	.tag-blue { background: #E8F0FF; color: #3B7CFF; }
	.tag-green { background: #E6F7EC; color: #19A15F; }
	.tag-orange { background: #FFF3E4; color: #E68A00; }
	.tag-red { background: #FDECEC; color: #F56C6C; }
	.tag-gray { background: #F0F2F5; color: #909399; }

	/* 带状态圆点的标签 */
	.tag .dot {
		width: 10rpx;
		height: 10rpx;
		border-radius: 50%;
		margin-right: 8rpx;
	}

	.tag-green .dot { background: #19A15F; }
	.tag-orange .dot { background: #E68A00; }
	.tag-gray .dot { background: #909399; }
	.tag-red .dot { background: #F56C6C; }
	.tag-blue .dot { background: #3B7CFF; }

	/* ========== 表单 ========== */
	.form-item {
		margin-bottom: 24rpx;
	}

	.form-label {
		font-size: 26rpx;
		color: #606266;
		margin-bottom: 12rpx;
		display: block;
	}

	.form-label .req {
		color: #F56C6C;
		margin-right: 6rpx;
	}

	.form-input, .form-textarea {
		background: #F8FAFC;
		border: 2rpx solid #E5E7EB;
		border-radius: 12rpx;
		padding: 16rpx 20rpx;
		font-size: 28rpx;
		width: 100%;
		box-sizing: border-box;
		transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
	}

	/* 聚焦态：蓝色描边 + 光晕，uni-app H5 下 input 被包裹，用 focus-within 捕获 */
	.form-input:focus,
	.form-input:focus-within,
	.form-textarea:focus,
	.form-textarea:focus-within {
		background: #ffffff;
		border-color: #3B7CFF;
		box-shadow: 0 0 0 4rpx rgba(59, 124, 255, 0.12);
		outline: none;
	}

	/* 悬停态（PC） */
	@media (min-width: 900px) {
		.form-input:hover,
		.form-textarea:hover {
			border-color: #9FBDFF;
		}
	}

	.form-textarea {
		line-height: 1.7;
	}

	/* ========== 数据表格（view + grid 实现，兼容全端） ========== */
	.table-card {
		padding: 0;
		overflow: hidden;
	}

	.tbl-scroll {
		width: 100%;
		overflow-x: auto;
	}

	/* 内部表格容器：各页面通过自定义 class 设定最小宽度与列模板 */
	.vtable {
		width: 100%;
	}

	.vhead {
		display: grid;
		background: #F8FAFC;
		border-bottom: 1rpx solid #EBEEF5;
	}

	.vrow {
		display: grid;
		border-bottom: 1rpx solid #F2F4F8;
		transition: background 0.12s ease;
	}

	.vrow:last-child {
		border-bottom: none;
	}

	.vrow:hover {
		background: #F6F9FF;
	}

	.vth {
		padding: 20rpx 24rpx;
		font-size: 24rpx;
		font-weight: 600;
		color: #606266;
		display: flex;
		align-items: center;
		white-space: nowrap;
		min-width: 0;
	}

	.vtd {
		padding: 20rpx 24rpx;
		font-size: 26rpx;
		color: #303133;
		display: flex;
		align-items: center;
		min-width: 0;
	}

	.vth.col-ops,
	.vtd.col-ops {
		justify-content: flex-end;
		white-space: nowrap;
	}

	.op-link {
		font-size: 25rpx;
		padding: 4rpx 10rpx;
		cursor: pointer;
	}

	.op-edit { color: #3B7CFF; }
	.op-del { color: #F56C6C; }
	.op-view { color: #19A15F; }

	/* 单元格内主文字 + 副信息 */
	.cell-main {
		font-weight: 600;
		color: #1F2937;
		line-height: 1.4;
	}

	.cell-sub {
		font-size: 22rpx;
		color: #909399;
		margin-top: 4rpx;
	}

	/* ========== 页面操作栏（数量/标题 + 主操作按钮） ========== */
	.page-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
		gap: 16rpx;
		flex-wrap: wrap;
	}

	.page-bar-title {
		font-size: 30rpx;
		font-weight: 600;
		color: #1F2937;
	}

	.page-bar-ops {
		display: flex;
		align-items: center;
		gap: 14rpx;
	}

	/* 筛选栏：白底卡，内部 flex 换行 */
	.filter-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16rpx;
	}

	.filter-bar .field {
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.filter-bar .field-label {
		font-size: 25rpx;
		color: #606266;
		white-space: nowrap;
	}

	.filter-select {
		background: #F4F6FA;
		border-radius: 8rpx;
		padding: 12rpx 20rpx;
		font-size: 25rpx;
		color: #303133;
		min-width: 160rpx;
	}

	/* ========== 工作台：数据概览卡 ========== */
	.stat-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 20rpx;
		margin-bottom: 20rpx;
	}

	.stat-box {
		background: #fff;
		border-radius: 12rpx;
		padding: 28rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
		display: flex;
		align-items: center;
		gap: 22rpx;
	}

	.stat-box-icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 38rpx;
		flex-shrink: 0;
	}

	.stat-box-val {
		font-size: 44rpx;
		font-weight: 700;
		color: #1F2937;
		line-height: 1.2;
	}

	.stat-box-label {
		font-size: 23rpx;
		color: #909399;
		margin-top: 4rpx;
	}

	@media (min-width: 900px) {
		.stat-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}

	/* 快捷入口宫格 */
	.quick-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 20rpx;
	}

	.quick-item {
		background: #fff;
		border: 1rpx solid #EDF0F5;
		border-radius: 12rpx;
		padding: 28rpx;
		display: flex;
		align-items: center;
		gap: 22rpx;
		transition: all 0.18s ease;
	}

	.quick-item .qi-icon {
		width: 76rpx;
		height: 76rpx;
		border-radius: 14rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 36rpx;
		flex-shrink: 0;
	}

	.quick-item .qi-name {
		font-size: 28rpx;
		font-weight: 600;
		color: #1F2937;
	}

	.quick-item .qi-desc {
		font-size: 22rpx;
		color: #909399;
		margin-top: 4rpx;
	}

	@media (min-width: 900px) {
		.quick-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.quick-item:hover {
			border-color: #B9CDFF;
			box-shadow: 0 8rpx 24rpx rgba(59, 124, 255, 0.12);
			transform: translateY(-2rpx);
			cursor: pointer;
		}
	}

	/* 区块标题 */
	.section-title {
		font-size: 29rpx;
		font-weight: 600;
		color: #1F2937;
		margin-bottom: 20rpx;
		display: flex;
		align-items: center;
		gap: 12rpx;
	}

	.section-title::before {
		content: '';
		width: 8rpx;
		height: 28rpx;
		border-radius: 4rpx;
		background: #3B7CFF;
	}

	/* ========== 空状态 / 工具类 ========== */
	.empty-tip {
		text-align: center;
		color: #909399;
		padding: 80rpx 0;
		font-size: 26rpx;
	}

	.row-between {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.muted {
		color: #909399;
		font-size: 24rpx;
	}

	.text-primary { color: #3B7CFF; }
	.text-success { color: #19A15F; }
	.text-danger { color: #F56C6C; }
	.fw-600 { font-weight: 600; }
</style>
