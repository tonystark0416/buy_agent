<template>
  <div>
    <!-- 筛选区 -->
    <el-card class="filter-card" shadow="never">
      <el-form inline :model="query" @submit.prevent>
        <el-form-item label="平台">
          <el-select v-model="query.platforms" multiple collapse-tags placeholder="全部" style="width: 180px">
            <el-option v-for="p in PLATFORMS" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="query.orderSn" placeholder="精确匹配" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="商品名">
          <el-input v-model="query.goodsName" placeholder="模糊匹配" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input v-model="query.uid" placeholder="uid" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 340px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表区 -->
    <el-card shadow="never">
      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column label="商品" min-width="260">
          <template #default="{ row }">
            <div class="goods-cell">
              <el-image
                v-if="row.goods_img_url"
                :src="row.goods_img_url"
                fit="cover"
                class="goods-img"
                :preview-src-list="[row.goods_img_url]"
                preview-teleported
              />
              <span class="goods-name">{{ row.goods_name || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="order_sn" label="订单号" min-width="180" show-overflow-tooltip />
        <el-table-column label="平台" width="90">
          <template #default="{ row }">
            <el-tag :type="platformTagType(row.platform)" effect="light">{{ row.platform || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="uid" label="用户ID" width="80" />
        <el-table-column label="订单金额" width="110" align="right">
          <template #default="{ row }">￥{{ row.order_amount }}</template>
        </el-table-column>
        <el-table-column label="佣金" width="100" align="right">
          <template #default="{ row }">
            <span class="commission">￥{{ row.commission }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="plain">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="下单时间" width="170" />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row.order_sn)">详情</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无订单数据" />
        </template>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadList(1)"
          @current-change="loadList()"
        />
      </div>
    </el-card>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" title="订单详情" size="420px">
      <template v-if="detail">
        <div class="detail-img-wrap">
          <el-image
            v-if="detail.order.goods_img_url"
            :src="detail.order.goods_img_url"
            fit="contain"
            class="detail-img"
            :preview-src-list="[detail.order.goods_img_url]"
          />
        </div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单号">{{ detail.order.order_sn }}</el-descriptions-item>
          <el-descriptions-item label="商品名称">{{ detail.order.goods_name }}</el-descriptions-item>
          <el-descriptions-item label="商品ID">{{ detail.order.goods_id }}</el-descriptions-item>
          <el-descriptions-item label="平台">
            <el-tag :type="platformTagType(detail.order.platform)">{{ detail.order.platform }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="订单金额">￥{{ detail.order.order_amount }}</el-descriptions-item>
          <el-descriptions-item label="佣金">￥{{ detail.order.commission }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ statusText(detail.order.status) }}（{{ detail.order.status }}）</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ detail.order.create_time }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ detail.order.update_time }}</el-descriptions-item>
        </el-descriptions>
        <el-divider content-position="left">关联用户</el-divider>
        <template v-if="detail.user">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="用户ID">{{ detail.user.id }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ detail.user.phone }}</el-descriptions-item>
          </el-descriptions>
        </template>
        <el-empty v-else description="未关联用户" :image-size="60" />
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getOrderList, getOrderDetail } from '../../api/order'

const PLATFORMS = [
  { value: 'vip', label: '唯品会' },
  { value: 'pdd', label: '拼多多' },
  { value: 'meituan', label: '美团' }
]

// 平台状态枚举以后端实际入库值为准，此处做常见值映射，未知值原样展示
const STATUS_MAP = {
  0: '待付款', 1: '已付款', 2: '已完成', 3: '已取消', 4: '已结算', 5: '已失效'
}

const query = reactive({
  page: 1,
  pageSize: 20,
  platforms: [],
  orderSn: '',
  goodsName: '',
  uid: ''
})
const dateRange = ref(null)

const list = ref([])
const total = ref(0)
const loading = ref(false)

const detailVisible = ref(false)
const detail = ref(null)

function statusText(status) {
  return STATUS_MAP[status] ?? String(status ?? '-')
}

function statusTagType(status) {
  if (STATUS_MAP[status] === '已完成' || STATUS_MAP[status] === '已结算') return 'success'
  if (STATUS_MAP[status] === '已取消' || STATUS_MAP[status] === '已失效') return 'info'
  return 'warning'
}

function platformTagType(platform) {
  return { vip: 'danger', pdd: 'error', meituan: 'warning' }[platform] || 'info'
}

async function loadList(page) {
  if (page) query.page = page
  loading.value = true
  try {
    const params = {
      page: query.page,
      pageSize: query.pageSize,
      orderSn: query.orderSn || undefined,
      goodsName: query.goodsName || undefined,
      uid: query.uid || undefined,
      platform: query.platforms.length ? query.platforms.join(',') : undefined,
      startTime: dateRange.value?.[0],
      endTime: dateRange.value?.[1]
    }
    const data = await getOrderList(params)
    list.value = data.list
    total.value = data.total
  } catch (e) {
    // 拦截器已统一提示
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  loadList(1)
}

function handleReset() {
  query.platforms = []
  query.orderSn = ''
  query.goodsName = ''
  query.uid = ''
  dateRange.value = null
  loadList(1)
}

async function openDetail(orderSn) {
  detailVisible.value = true
  detail.value = null
  try {
    detail.value = await getOrderDetail(orderSn)
  } catch (e) {
    detailVisible.value = false
  }
}

onMounted(() => loadList())
</script>

<style scoped>
.filter-card {
  margin-bottom: 12px;
}
.filter-card :deep(.el-form-item) {
  margin-bottom: 8px;
  margin-right: 16px;
}
.goods-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.goods-img {
  width: 44px;
  height: 44px;
  border-radius: 4px;
  flex-shrink: 0;
}
.goods-name {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-size: 13px;
  color: #303133;
}
.commission {
  color: #f56c6c;
  font-weight: 600;
}
.pager {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}
.detail-img-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}
.detail-img {
  width: 200px;
  height: 200px;
  border-radius: 6px;
}
</style>
