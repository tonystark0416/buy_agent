<template>
  <div>
    <!-- 筛选区 -->
    <el-card class="filter-card" shadow="never">
      <el-form inline :model="query" @submit.prevent>
        <el-form-item label="平台">
          <el-select v-model="query.platform" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="p in PLATFORMS" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品名">
          <el-input v-model="query.goodsName" placeholder="模糊匹配" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-button v-if="canWrite" type="success" :icon="Plus" @click="openCreate">新增商品</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-alert
      type="info"
      :closable="false"
      show-icon
      class="tips"
      title="本页数据为 C 端首页「拼多多运营选品」Tab 的数据源，增删改实时生效"
    />

    <!-- 列表区 -->
    <el-card shadow="never">
      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="商品" min-width="280">
          <template #default="{ row }">
            <div class="goods-cell">
              <el-image
                v-if="row.goods_image_url"
                :src="row.goods_image_url"
                fit="cover"
                class="goods-img"
                :preview-src-list="[row.goods_image_url]"
                preview-teleported
              />
              <div v-else class="goods-img goods-img-empty">无图</div>
              <span class="goods-name">{{ row.goods_name || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="平台" width="90">
          <template #default="{ row }">
            <el-tag :type="platformTagType(row.platform)">{{ platformLabel(row.platform) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="市场价" width="100" align="right">
          <template #default="{ row }">
            <span class="market-price">￥{{ row.market_price ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="售价" width="100" align="right">
          <template #default="{ row }">
            <span class="sale-price">￥{{ row.sale_price ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="平台商品ID" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.goods_platform_id || '-' }}</template>
        </el-table-column>
        <el-table-column prop="update_time" label="更新时间" width="170" />
        <el-table-column v-if="canWrite" label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无商品数据" />
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑商品' : '新增商品'"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="商品名称" prop="goods_name">
          <el-input v-model="form.goods_name" type="textarea" :rows="2" maxlength="200" show-word-limit placeholder="展示在首页的商品标题" />
        </el-form-item>
        <el-form-item label="平台" prop="platform">
          <el-select v-model="form.platform" placeholder="选择平台" style="width: 100%">
            <el-option v-for="p in PLATFORMS" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="市场价" prop="market_price">
          <el-input-number v-model="form.market_price" :min="0" :precision="2" :step="1" placeholder="如 122.00" style="width: 100%" controls-position="right" />
        </el-form-item>
        <el-form-item label="售价" prop="sale_price">
          <el-input-number v-model="form.sale_price" :min="0" :precision="2" :step="1" placeholder="如 16.80" style="width: 100%" controls-position="right" />
        </el-form-item>
        <el-form-item label="商品图URL" prop="goods_image_url">
          <el-input v-model="form.goods_image_url" placeholder="http(s):// 开头的图片链接" />
        </el-form-item>
        <el-form-item label="平台商品ID" prop="goods_platform_id">
          <el-input v-model="form.goods_platform_id" placeholder="如拼多多 goods_sign，C 端详情/转链依赖此字段" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { getGoodsList, createGoods, updateGoods, deleteGoods } from '../../api/goods'

const PLATFORMS = [
  { value: 'pdd', label: '拼多多' },
  { value: 'vip', label: '唯品会' },
  { value: 'meituan', label: '美团' }
]

// 只读角色隐藏写操作入口
const canWrite = computed(() => {
  const info = JSON.parse(localStorage.getItem('admin_info') || 'null')
  return info && info.role !== 'readonly'
})

const query = reactive({ page: 1, pageSize: 20, platform: '', goodsName: '' })
const list = ref([])
const total = ref(0)
const loading = ref(false)

const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref(null)
const form = reactive({
  id: null, goods_name: '', platform: '', market_price: undefined,
  sale_price: undefined, goods_image_url: '', goods_platform_id: ''
})

const rules = {
  goods_name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  platform: [{ required: true, message: '请选择平台', trigger: 'change' }],
  goods_platform_id: [{ required: true, message: '请输入平台商品 ID', trigger: 'blur' }],
  goods_image_url: [
    { pattern: /^https?:\/\//i, message: '图片 URL 必须以 http(s):// 开头', trigger: 'blur' }
  ]
}

function platformLabel(p) {
  return PLATFORMS.find((x) => x.value === p)?.label || p || '-'
}
function platformTagType(p) {
  return { vip: 'danger', pdd: 'error', meituan: 'warning' }[p] || 'info'
}

async function loadList(page) {
  if (page) query.page = page
  loading.value = true
  try {
    const params = {
      page: query.page,
      pageSize: query.pageSize,
      platform: query.platform || undefined,
      goodsName: query.goodsName || undefined
    }
    const data = await getGoodsList(params)
    list.value = data.list
    total.value = data.total
  } catch (e) {
    // 拦截器已统一提示
  } finally {
    loading.value = false
  }
}

function handleSearch() { loadList(1) }
function handleReset() {
  query.platform = ''
  query.goodsName = ''
  loadList(1)
}

function openCreate() {
  Object.assign(form, {
    id: null, goods_name: '', platform: '', market_price: undefined,
    sale_price: undefined, goods_image_url: '', goods_platform_id: ''
  })
  dialogVisible.value = true
}

function openEdit(row) {
  Object.assign(form, {
    id: row.id,
    goods_name: row.goods_name,
    platform: row.platform,
    market_price: row.market_price !== null ? Number(row.market_price) : undefined,
    sale_price: row.sale_price !== null ? Number(row.sale_price) : undefined,
    goods_image_url: row.goods_image_url || '',
    goods_platform_id: row.goods_platform_id || ''
  })
  dialogVisible.value = true
}

async function handleSave() {
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }
  saving.value = true
  try {
    const payload = {
      goods_name: form.goods_name,
      platform: form.platform,
      market_price: form.market_price ?? null,
      sale_price: form.sale_price ?? null,
      goods_image_url: form.goods_image_url || null,
      goods_platform_id: form.goods_platform_id
    }
    if (form.id) {
      await updateGoods(form.id, payload)
      ElMessage.success('修改成功')
    } else {
      await createGoods(payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadList(form.id ? query.page : 1)
  } catch (e) {
    // 拦截器已统一提示
  } finally {
    saving.value = false
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(
    `确定删除「${(row.goods_name || '').slice(0, 20)}…」吗？删除后将立即从 C 端首页 Tab 下架，不可恢复。`,
    '删除确认',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
  )
    .then(async () => {
      await deleteGoods(row.id)
      ElMessage.success('删除成功')
      loadList()
    })
    .catch(() => {})
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
.tips {
  margin-bottom: 12px;
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
.goods-img-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #c0c4cc;
  font-size: 12px;
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
.market-price {
  color: #909399;
  text-decoration: line-through;
  font-size: 13px;
}
.sale-price {
  color: #f56c6c;
  font-weight: 600;
}
.pager {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}
</style>
