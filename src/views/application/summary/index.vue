<template>
  <div class="app-container">
    <!--工具栏-->
    <div class="head-container">

      <div v-if="crud.props.searchToggle">
        <!-- 搜索框保持不变 -->
        <label class="el-form-item-label">申请单UUID</label>
        <el-input v-model="query.uuid" clearable placeholder="申请单ID" style="width: 185px;" class="filter-item" @keyup.enter.native="crud.toQuery" />
        <label class="el-form-item-label">申请人姓名</label>
        <el-input v-model="query.applicantUserName" clearable placeholder="申请人姓名" style="width: 185px;" class="filter-item" @keyup.enter.native="crud.toQuery" />
        <label class="el-form-item-label">申请单类型</label>
        <el-input v-model="query.applicationType" clearable placeholder="申请单类型" style="width: 185px;" class="filter-item" @keyup.enter.native="crud.toQuery" />
        <label class="el-form-item-label">申请单数据类型</label>
        <el-input v-model="query.applicationDataType" clearable placeholder="申请单数据类型" style="width: 185px;" class="filter-item" @keyup.enter.native="crud.toQuery" />
        <rrOperation :crud="crud" />
      </div>

      <crudOperation :permission="permission" />

      <!-- 显示全部开关 -->
      <el-switch
        v-model="showAll"
        active-text="显示全部"
        style="margin-right: 15px;"
        @change="onSwitchChange"
      />

      <!-- 表格渲染 -->
      <el-table ref="table" v-loading="crud.loading" :data="crud.data" size="small" style="width: 100%;" @selection-change="crud.selectionChangeHandler">
        <!--        <el-table-column type="selection" width="55" />-->
        <el-table-column prop="uuid" label="申请单ID" align="center" />
        <el-table-column prop="applicantUserName" label="申请人姓名" align="center" />
        <el-table-column prop="applicationDate" label="申请日期" align="center" />
        <el-table-column prop="applicationType" label="申请单类型" align="center" />
        <el-table-column prop="applicationDataType" label="申请单数据类型" align="center" />
        <el-table-column prop="applicationTitle" label="申请单标题" align="center" />
        <el-table-column label="申请状态" align="center">
          <template slot-scope="scope">
            <div style="text-align: center;">{{ getStatusName(scope.row.status) }}</div>
          </template>
        </el-table-column>
        <!-- 操作列：动态权限控制 -->
        <el-table-column label="操作" width="300px" align="center">
          <template slot-scope="scope">
            <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 8px;">
              <!-- 查看：所有人都可以看（或者你也可以限制权限）除了草稿 -->
              <el-button v-if="scope.row.status !== STATUS_DRAFT" size="mini" type="text" @click="handleView(scope.row)">查看</el-button>

              <!-- 只有本人的申请单才显示其他操作按钮 -->
              <template v-if="isSelf(scope.row)">
                <!-- 填写：草稿状态 -->
                <el-button v-if="scope.row.status === STATUS_DRAFT" size="mini" type="text" @click="handleFill(scope.row)">填写</el-button>

                <!-- 删除：草稿状态 -->
                <el-button
                  v-if="scope.row.status === STATUS_DRAFT"
                  size="mini"
                  type="text"
                  style="color: #E53935;"
                  @click="handleDelete(scope.row)"
                >
                  删除
                </el-button>

                <!-- 撤回：已提交状态 -->
                <el-button v-if="scope.row.status === STATUS_SUBMITTED || scope.row.status === STATUS_FIRMWARE_FAILED || scope.row.status === STATUS_FIRMWARE_FAILED || scope.row.status === STATUS_SYNC_FAILED" size="mini" type="text" style="color: #FFA000;" @click="handleWithdraw(scope.row)">撤回</el-button>

                <!-- 重新填写：已驳回状态 -->
                <el-button
                  v-if="scope.row.status === STATUS_REJECTED || scope.row.status === STATUS_WITHDRAWN"
                  size="mini"
                  type="text"
                  @click="handleFill(scope.row)"
                >
                  重新填写
                </el-button>

                <!-- 固件校验：固件校验中状态 -->
                <el-button v-if="scope.row.status === STATUS_FIRMWARE_VERIFY" size="mini" type="text" style="color: #4CAF50;" @click="handleFirmwareCheck(scope.row)">固件校验</el-button>

                <!-- 发布同步：同步中或同步失败状态 -->
                <el-button
                  v-if="scope.row.status === STATUS_SYNCING || scope.row.status === STATUS_SYNC_FAILED"
                  size="mini"
                  type="text"
                  style="color: #2196F3;"
                  @click="handlePublishSync(scope.row)"
                >
                  发布同步
                </el-button>
              </template>
            </div>
          </template>
        </el-table-column>

      </el-table>

      <!-- 查看详情的弹窗 -->
      <el-dialog
        :visible.sync="detailVisible"
        title="申请单详情"
        width="800px"
        top="5vh"
        :close-on-click-modal="false"
      >
        <el-tabs type="border-card">
          <!-- Tab 1: 申请信息 -->
          <el-tab-pane label="单据信息">
            <el-descriptions :column="1" border size="medium">
              <el-descriptions-item label="申请单ID">{{ detail.uuid }}</el-descriptions-item>
              <el-descriptions-item label="申请人">{{ detail.applicantUserName }}</el-descriptions-item>
              <el-descriptions-item label="表单标题">{{ detail.applicationTitle }}</el-descriptions-item>
              <el-descriptions-item label="申请日期">{{ detail.createdAt }}</el-descriptions-item>
              <el-descriptions-item label="申请类型">{{ getApplicationTypeName(detail.applicationType) }}</el-descriptions-item>
              <el-descriptions-item label="数据类型">{{ getApplicationDataTypeName(detail.applicationDataType) }}</el-descriptions-item>
              <el-descriptions-item label="申请状态">{{ getStatusName(detail.status) }}</el-descriptions-item>
              <el-descriptions-item label="申请理由">
                <div style="white-space: pre-wrap;">{{ detail.applicationReason || '暂无' }}</div>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <!-- Tab 2: 设备信息 -->
          <el-tab-pane label="设备信息">
            <div v-if="loadingDeviceInfo">正在加载设备信息...</div>
            <el-descriptions v-else :column="1" border size="medium">
              <el-descriptions-item label="设备型号">{{ parsedDeviceInfo.model || '暂无' }}</el-descriptions-item>
              <el-descriptions-item label="设备版本">{{ parsedDeviceInfo.modelVersion || '暂无' }}</el-descriptions-item>
              <el-descriptions-item label="设备类型">{{ getModelTypeName(parsedDeviceInfo.modelType) || '暂无' }}</el-descriptions-item>
              <el-descriptions-item label="设备种类">{{ getTypeName(parsedDeviceInfo.type) || '暂无' }}</el-descriptions-item>
              <el-descriptions-item label="硬件版本">{{ parsedDeviceInfo.hwVersion || '暂无' }}</el-descriptions-item>
              <el-descriptions-item label="模版版本">{{ parsedDeviceInfo.controllerVersion || '暂无' }}</el-descriptions-item>
              <el-descriptions-item label="设备版本号">{{ parsedDeviceInfo.version || '暂无' }}</el-descriptions-item>
              <el-descriptions-item label="收养报文">
                <div style="white-space: pre-wrap;">{{ parsedDeviceInfo.adoptResp || '暂无' }}</div>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <!-- Tab 3: 审核信息 -->
          <el-tab-pane label="审核信息">
            <el-descriptions :column="1" border size="medium">
              <!-- 测试接口人 -->
              <el-descriptions-item label="测试接口人">
                <div>
                  <div><strong>审核人：</strong>{{ detail.testContact || '暂无' }}</div>
                  <div><strong>审核状态：</strong><el-tag :type="approvalTag(detail.testContactApproval)">{{ getApprovalStatusName(detail.testContactApproval) || '未审核' }}</el-tag></div>
                  <div><strong>审核意见：</strong>{{ detail.testContactComment || '无' }}</div>
                </div>
              </el-descriptions-item>

              <!-- 研发接口人 -->
              <el-descriptions-item label="研发接口人">
                <div>
                  <div><strong>审核人：</strong>{{ detail.devContact || '暂无' }}</div>
                  <div><strong>审核状态：</strong><el-tag :type="approvalTag(detail.devContactApproval)">{{ getApprovalStatusName(detail.devContactApproval) || '未审核' }}</el-tag></div>
                  <div><strong>审核意见：</strong>{{ detail.devContactComment || '无' }}</div>
                </div>
              </el-descriptions-item>

              <!-- 测试组长 -->
              <el-descriptions-item label="测试组长">
                <div>
                  <div><strong>审核人：</strong>{{ detail.testLeader || '暂无' }}</div>
                  <div><strong>审核状态：</strong><el-tag :type="approvalTag(detail.testLeaderApproval)">{{ getApprovalStatusName(detail.testLeaderApproval) || '未审核' }}</el-tag></div>
                  <div><strong>审核意见：</strong>{{ detail.testLeaderComment || '无' }}</div>
                </div>
              </el-descriptions-item>

              <!-- 研发组长 -->
              <el-descriptions-item label="研发组长">
                <div>
                  <div><strong>审核人：</strong>{{ detail.devLeader || '暂无' }}</div>
                  <div><strong>审核状态：</strong><el-tag :type="approvalTag(detail.devLeaderApproval)">{{ getApprovalStatusName(detail.devLeaderApproval) || '未审核' }}</el-tag></div>
                  <div><strong>审核意见：</strong>{{ detail.devLeaderComment || '无' }}</div>
                </div>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <!-- Tab 4: 历史记录 -->
          <el-tab-pane label="历史记录">
            <div v-if="approvalHistory.length === 0" style="text-align: center; padding: 20px;">
              暂无审批历史记录
            </div>
            <div v-else>
              <div v-for="(round, index) in groupedApprovalHistory" :key="index">
                <h3>第 {{ round.round }} 轮审批</h3>
                <el-timeline>
                  <el-timeline-item
                    v-for="(record, idx) in round.records"
                    :key="idx"
                    :timestamp="formatTimestamp(record.approvedAt)"
                    placement="top"
                  >
                    <el-card>
                      <div><strong>审批角色：</strong>{{ getApproverRoleName(record.approverRole) }}</div>
                      <div><strong>审批人：</strong>{{ record.approverUserName }}</div>
                      <div><strong>审批状态：</strong><el-tag :type="approvalTag(record.approvalStatus)">{{getApprovalStatusName(record.approvalStatus)}}</el-tag></div>
                      <div><strong>审批意见：</strong>{{ record.comment || '无' }}</div>
                    </el-card>
                  </el-timeline-item>
                </el-timeline>
                <el-divider v-if="index < groupedApprovalHistory.length - 1"></el-divider>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>

        <div slot="footer" class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
        </div>
      </el-dialog>
      <!-- 申请单表单弹窗 -->
      <ApplicationFormDialog
        :visible.sync="formDialogVisible"
        :form-data="currentFormData"
        :mode="formMode"
        @close="handleFormClose"
        @submit-success="handleFormSubmitSuccess"
        @save-success="handleFormSaveSuccess"
      />
      <!-- 分页 -->
      <pagination />
    </div>
  </div>
</template>

<script>
import crudDeviceApplicationForm from '@/api/deviceApplicationForm.js'
import CRUD, { presenter, header, form, crud } from '@crud/crud'
import rrOperation from '@crud/RR.operation'
import crudOperation from '@crud/CRUD.operation'
import pagination from '@crud/Pagination'
import ApplicationFormDialog from './ApplicationFormDialog.vue'
import { withdrawApplication, deleteApplicationForm } from '@/api/deviceApplicationForm'

const defaultForm = {

}

export default {
  name: 'DeviceApplicationForm',
  components: { pagination, crudOperation, rrOperation, ApplicationFormDialog },
  mixins: [presenter(), header(), form(defaultForm), crud()],
  cruds() {
    return CRUD({
      title: '申请单接口',
      url: 'api/deviceApplicationForm',
      idField: 'id',
      sort: 'id,desc',
      crudMethod: { ...crudDeviceApplicationForm },
      optShow: { add: false, edit: false, del: false }
    })
  },
  data() {
    return {
      // 新增：详情相关状态
      detailVisible: false,
      detail: {},
      loadingDeviceInfo: false,
      parsedDeviceInfo: {}, // 存储解析后的设备信息
      approvalHistory: [], // 存储解析后的审批历史记录
      groupedApprovalHistory: [], // 按轮次分组的审批历史记录

      // 表单弹窗相关
      formDialogVisible: false,
      currentFormData: {},
      formMode: 'add', // 'add' 或 'edit'

      // 申请单状态常量定义
      STATUS_DRAFT: -1, // 草稿
      STATUS_SUBMITTED: 0, // 已提交
      STATUS_PENDING: 1, // 待审批
      STATUS_APPROVED: 2, // 审批通过
      STATUS_FIRMWARE_VERIFY: 3, // 固件校验中
      STATUS_FIRMWARE_FAILED: 4, // 固件校验失败
      STATUS_SYNCING: 5, // 同步中
      STATUS_SYNC_FAILED: 6, // 同步失败
      STATUS_COMPLETED: 7, // 已完成
      STATUS_REJECTED: 8, // 已驳回
      STATUS_AUTO_PROCESSING: 9, // 自动处理中
      STATUS_AUTO_FAILED: 10, // 自动处理失败
      STATUS_MANUAL_TRIGGERED: 11, // 手动触发
      STATUS_WITHDRAWN: 12, // 已撤回

      APPROVAL_STATUS_PENDING: 0,
      APPROVAL_STATUS_APPROVED: 1,
      APPROVAL_STATUS_REJECTED: 2,

      permission: {
        add: ['admin', 'deviceApplicationForm.js:add'],
        edit: ['admin', 'deviceApplicationForm.js:edit'],
        del: ['admin', 'deviceApplicationForm.js:del']
      },
      rules: {
        uuid: [{ required: true, message: '申请单不能为空', trigger: 'blur' }],
        applicantUserName: [{ required: true, message: '申请人姓名不能为空', trigger: 'blur' }],
        applicationDate: [{ required: true, message: '申请日期不能为空', trigger: 'blur' }],
        applicationType: [{ required: true, message: '申请单类型', trigger: 'blur' }],
        applicationDataType: [{ required: true, message: '申请单数据类型', trigger: 'blur' }],
        applicationTitle: [{ required: true, message: '申请单标题不能为空', trigger: 'blur' }],
        status: [{ required: true, message: '申请状态不能为空', trigger: 'blur' }]
      },
      queryTypeOptions: [
        { key: 'uuid', display_name: '申请单ID' },
        { key: 'applicantUserName', display_name: '申请人姓名' },
        { key: 'applicationType', display_name: '申请单类型' },
        { key: 'applicationDataType', display_name: '申请单数据类型' }
      ],
      showAll: false, // 控制是否显示全部
      currentUser: this.$store.getters.user.username // 获取当前用户
    }
  },
  mounted() {
    // 初始化查询
    this.updateQuery()
  },
  methods: {
    isSelf(row) {
      const currentUserName = this.$store.getters.user.username
      return row.applicantUserName === currentUserName
    },

    // 开关变化处理
    onSwitchChange() {
      this.updateQuery()
    },

    // 更新查询条件
    updateQuery() {
      if (this.showAll) {
        // 显示全部：清空 applicantName 查询条件
        this.$delete(this.query, 'applicantUserName') // 或者 this.query.applicantName = null
      } else {
        // 仅显示当前用户
        this.query.applicantUserName = this.currentUser
      }
      this.crud.toQuery() // 重新请求数据
    },

    // 钩子：在获取数据前执行
    [CRUD.HOOK.beforeRefresh]() {
      // 确保每次刷新也遵循当前开关状态
      if (!this.showAll) {
        this.query.applicantUserName = this.currentUser
      } else {
        if (this.query.applicantUserName === this.currentUser) {
          this.$delete(this.query, 'applicantUserName')
        }
      }
      return true
    },

    // 钩子：页面加载后执行
    [CRUD.HOOK.afterRefresh]() {
      // 第一次加载时，如果没有 applicantName 查询条件，自动设置
      if (!this.query.applicantUserName && !this.showAll) {
        this.query.applicantUserName = this.currentUser
        this.crud.toQuery()
      }
    },
    // ============ 新增方法 ============

    // 处理点击"查看"
    handleView(row) {
      this.detail = { ...row } // 复制当前行数据
      this.parsedDeviceInfo = {}
      this.loadingDeviceInfo = true
      this.detailVisible = true

      // 解析设备信息
      if (row.deviceInfoDetails) {
        try {
          this.parsedDeviceInfo = typeof row.deviceInfoDetails === 'string'
            ? JSON.parse(row.deviceInfoDetails)
            : row.deviceInfoDetails
        } catch (e) {
          console.error('解析设备信息失败:', e)
          this.parsedDeviceInfo = {}
        }
      }

      // 解析审批历史记录
      this.parseApprovalHistory(row.approvalHistory)

      this.loadingDeviceInfo = false
    },

    // 解析审批历史记录
    parseApprovalHistory(history) {
      try {
        // 清空之前的记录
        this.approvalHistory = []
        this.groupedApprovalHistory = []

        if (!history) return

        // 解析JSON字符串
        const historyData = typeof history === 'string' ? JSON.parse(history) : history

        if (!Array.isArray(historyData) || historyData.length === 0) return

        // 存储解析后的记录
        this.approvalHistory = historyData

        // 按轮次分组并排序
        const grouped = {}
        historyData.forEach(record => {
          if (!grouped[record.round]) {
            grouped[record.round] = []
          }
          grouped[record.round].push(record)
        })

        // 转换为数组并按轮次降序排列
        this.groupedApprovalHistory = Object.keys(grouped)
          .map(round => ({
            round: parseInt(round),
            records: grouped[round]
          }))
          .sort((a, b) => b.round - a.round) // 从高到低排序
      } catch (e) {
        console.error('解析审批历史记录失败:', e)
        this.approvalHistory = []
        this.groupedApprovalHistory = []
      }
    },
    // 获取审批角色名称
    getApproverRoleName(role) {
      const roleMap = {
        'test_contact': '测试接口人',
        'dev_contact': '研发接口人',
        'test_leader': '测试组长',
        'dev_leader': '研发组长'
      }
      return roleMap[role] || role
    },
    // 获取审批状态名称
    getApprovalStatusName(status) {
      switch (parseInt(status)) {
        case this.APPROVAL_STATUS_PENDING: return '待审批'
        case this.APPROVAL_STATUS_APPROVED: return '通过'
        case this.APPROVAL_STATUS_REJECTED: return '驳回'
        default: return '未知'
      }
    },

    // 格式化时间戳
    formatTimestamp(timestamp) {
      if (!timestamp) return '未知时间'
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    },
    // 处理点击"填写"
    handleFill(row) {
      // 设置表单数据
      this.currentFormData = {
        id: row.id,
        uuid: row.uuid,
        applicationTitle: row.applicationTitle,
        applicationReason: row.applicationReason,
        applicationType: row.applicationType,
        applicationDataType: row.applicationDataType,
        applicantUserName: row.applicantUserName,
        devContact: row.devContact,
        testContact: row.testContact,
        devLeader: row.devLeader,
        testLeader: row.testLeader
      }

      // 解析设备信息
      if (row.deviceInfoDetails) {
        try {
          const deviceInfo = typeof row.deviceInfoDetails === 'string'
            ? JSON.parse(row.deviceInfoDetails)
            : row.deviceInfoDetails

          this.currentFormData.deviceDetail = {
            model: deviceInfo.model,
            modelVersion: deviceInfo.modelVersion,
            modelType: deviceInfo.modelType,
            type: deviceInfo.type,
            hwVersion: deviceInfo.hwVersion,
            controllerVersion: deviceInfo.controllerVersion,
            version: deviceInfo.version,
            adoptResp: deviceInfo.adoptResp
          }
        } catch (e) {
          console.error('解析设备信息失败:', e)
        }
      }

      // 设置模式为编辑
      this.formMode = 'edit'

      // 显示弹窗
      this.formDialogVisible = true
    },

    // 表单弹窗关闭事件
    handleFormClose() {
      this.formDialogVisible = false
      this.currentFormData = {}
    },

    // 表单提交成功事件
    handleFormSubmitSuccess() {
      this.crud.toQuery()
    },

    // 表单保存成功事件
    handleFormSaveSuccess() {
      this.crud.toQuery()
    },

    // 处理撤回申请单
    handleWithdraw(row) {
      this.$confirm('确定要撤回该申请单吗？撤回后将回到草稿状态。', '撤回申请单', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async() => {
        try {
          await withdrawApplication(row.id, row.applicantUserName)
          this.$message.success('撤回申请单成功')
          this.crud.toQuery() // 刷新列表
        } catch (error) {
          console.error('撤回申请单失败:', error)
          this.$message.error('撤回申请单失败')
        }
      }).catch(() => {
        // 用户取消操作
        this.$message.info('已取消撤回')
      })
    },

    // 处理删除申请单
    handleDelete(row) {
      this.$confirm('确定要删除该申请单吗？删除后将无法恢复。', '删除申请单', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async() => {
        try {
          await deleteApplicationForm(row.id, row.applicantUserName)
          this.$message.success('删除申请单成功')
          this.crud.toQuery() // 刷新列表
        } catch (error) {
          console.error('删除申请单失败:', error)
          this.$message.error('删除申请单失败')
        }
      }).catch(() => {
        // 用户取消操作
        this.$message.info('已取消删除')
      })
    },

    // 获取申请类型名称
    getApplicationTypeName(type) {
      const typeMap = {
        1: '新增',
        2: '编辑',
        3: '上线',
        4: '下线'
      }
      return typeMap[type] || '未知'
    },

    // 获取申请数据类型名称
    getApplicationDataTypeName(type) {
      const typeMap = {
        1: 'omada',
        2: 'vigi',
        3: 'adblocking'
      }
      return typeMap[type] || '未知'
    },

    // 获取状态名称（根据后端定义的状态常量）
    getStatusName(status) {
      const statusMap = {
        [this.STATUS_DRAFT]: '草稿',
        [this.STATUS_SUBMITTED]: '已提交',
        [this.STATUS_PENDING]: '待审批',
        [this.STATUS_APPROVED]: '审批通过',
        [this.STATUS_FIRMWARE_VERIFY]: '固件校验中',
        [this.STATUS_FIRMWARE_FAILED]: '固件校验失败',
        [this.STATUS_SYNCING]: '同步中',
        [this.STATUS_SYNC_FAILED]: '同步失败',
        [this.STATUS_COMPLETED]: '已完成',
        [this.STATUS_REJECTED]: '已驳回',
        [this.STATUS_AUTO_PROCESSING]: '自动处理中',
        [this.STATUS_AUTO_FAILED]: '自动处理失败',
        [this.STATUS_MANUAL_TRIGGERED]: '手动触发',
        [this.STATUS_WITHDRAWN]: '已撤回'
      }
      return statusMap[status] || '未知状态'
    },

    // 获取设备类型名称
    getModelTypeName(type) {
      const typeMap = {
        'NORMAL': '普通设备',
        'PRO': 'Pro设备',
        'COMBINED': '一体机',
        'PRO_FREE': 'PRO管理普通设备'
      }
      return typeMap[type] || type
    },

    // 获取设备种类名称
    getTypeName(type) {
      const typeMap = {
        'gateway': '网关',
        'switch': '交换机',
        'ap': 'AP',
        'olt': 'OLT',
        'other': '其他'
      }
      return typeMap[type] || type
    },

    // 根据审核状态返回 el-tag 类型
    approvalTag(status) {
      if (!status) return 'info'
      switch (parseInt(status)) {
        case this.APPROVAL_STATUS_PENDING: return 'info'
        case this.APPROVAL_STATUS_APPROVED: return 'success'
        case this.APPROVAL_STATUS_REJECTED: return 'danger'
        default: return 'info'
      }
    }
  }
}
</script>

