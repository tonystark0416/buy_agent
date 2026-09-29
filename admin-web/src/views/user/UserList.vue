<template>
  <div>
    <!-- 筛选区 -->
    <el-card class="filter-card" shadow="never">
      <el-form inline :model="query" @submit.prevent>
        <el-form-item label="手机号">
          <el-input v-model="query.phone" placeholder="模糊匹配" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input v-model="query.id" placeholder="精确匹配" clearable style="width: 140px" />
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
        <el-table-column prop="id" label="用户ID" width="100" />
        <el-table-column prop="phone" label="手机号" min-width="140" />
        <el-table-column label="openid" min-width="260" show-overflow-tooltip>
          <template #default="{ row }">{{ row.openid || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row.id)">详情</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无用户数据" />
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
    <el-drawer v-model="detailVisible" title="用户详情" size="480px">
      <template v-if="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户ID">{{ detail.user.id }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detail.user.phone }}</el-descriptions-item>
          <el-descriptions-item label="openid">{{ detail.user.openid || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">订单汇总</el-divider>
        <el-row :gutter="12" class="stat-row">
          <el-col :span="8">
            <div class="stat-card">
              <div class="stat-num">{{ detail.summary.orderCount }}</div>
              <div class="stat-label">总订单数</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-card">
              <div class="stat-num">￥{{ detail.summary.totalAmount }}</div>
              <div class="stat-label">总订单金额</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-card">
              <div class="stat-num commission">￥{{ detail.summary.totalCommission }}</div>
              <div class="stat-label">总佣金</div>
            </div>
          </el-col>
        </el-row>

        <template v-if="detail.statsByPlatform.length">
          <el-table :data="detail.statsByPlatform" size="small" border>
            <el-table-column prop="platform" label="平台" width="90">
              <template #default="{ row }">
                <el-tag :type="{ vip: 'danger', pdd: 'error', meituan: 'warning' }[row.platform] || 'info'">
                  {{ row.platform }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="order_count" label="订单数" align="center" />
            <el-table-column label="订单金额" align="right">
              <template #default="{ row }">￥{{ row.total_amount }}</template>
            </el-table-column>
            <el-table-column label="佣金" align="right">
              <template #default="{ row }">￥{{ row.total_commission }}</template>
            </el-table-column>
          </el-table>
        </template>
        <el-empty v-else description="该用户暂无订单" :image-size="60" />

        <el-divider content-position="left">最近订单</el-divider>
        <el-table v-loading="ordersLoading" :data="recentOrders" size="small" border>
          <el-table-column prop="goods_name" label="商品" min-width="140" show-overflow-tooltip />
          <el-table-column prop="platform" label="平台" width="80" />
          <el-table-column label="佣金" width="90" align="right">
            <template #default="{ row }">￥{{ row.commission }}</template>
          </el-table-column>
          <el-table-column prop="create_time" label="下单时间" width="160" />
          <template #empty>
            <el-empty description="无订单" :image-size="50" />
          </template>
        </el-table>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getUserList, getUserDetail } from '../../api/user'
import { getOrderList } from '../../api/order'

const query = reactive({
  page: 1,
  pageSize: 20,
  phone: '',
  id: ''
})

const list = ref([])
const total = ref(0)
const loading = ref(false)

const detailVisible = ref(false)
const detail = ref(null)
const recentOrders = ref([])
const ordersLoading = ref(false)

async function loadList(page) {
  if (page) query.page = page
  loading.value = true
  try {
    const params = {
      page: query.page,
      pageSize: query.pageSize,
      phone: query.phone || undefined,
      id: query.id || undefined
    }
    const data = await getUserList(params)
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
  query.phone = ''
  query.id = ''
  loadList(1)
}

async function openDetail(id) {
  detailVisible.value = true
  detail.value = null
  recentOrders.value = []
  try {
    detail.value = await getUserDetail(id)
    // 顺便加载该用户最近 10 条订单
    ordersLoading.value = true
    const orders = await getOrderList({ uid: id, page: 1, pageSize: 10 })
    recentOrders.value = orders.list
  } catch (e) {
    // 拦截器已统一提示
  } finally {
    ordersLoading.value = false
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
.pager {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}
.stat-row {
  margin-bottom: 16px;
}
.stat-card {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 12px 8px;
  text-align: center;
}
.stat-num {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
.stat-num.commission {
  color: #f56c6c;
}
.stat-label {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}
</style>
