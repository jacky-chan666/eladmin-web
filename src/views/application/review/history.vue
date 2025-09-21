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
        <el-table-column prop="uuid" label="申请单ID" align="center" />
        <el-table-column prop="applicantUserName" label="申请人姓名" align="center" />
        <el-table-column prop="applicationDate" label="申请日期" align="center" />
        <el-table-column prop="applicationType" label="申请单类型" align="center">
          <template slot-scope="scope">
            <div style="text-align: center;">{{ getApplicationTypeName(scope.row.applicationType) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="applicationDataType" label="申请单数据类型" align="center">
          <template slot-scope="scope">
            <div style="text-align: center;">{{ getApplicationDataTypeName(scope.row.applicationDataType) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="applicationTitle" label="申请单标题" align="center" />
        <el-table-column prop="status" label="申请状态" align="center">
          <template slot-scope="scope">
            <div style="text-align: center;">{{ getStatusName(scope.row.status) }}</div>
          </template>
        </el-table-column>
        <!-- 操作列：动态权限控制 -->
        <el-table-column label="操作" width="300px" align="center">
          <template slot-scope="scope">
            <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 8px;">
              <!-- 查看：所有人都可以看（或者你也可以限制权限）除了草稿 -->
              <el-button size="mini" type="text" @click="handleView(scope.row)">查看</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 使用公共组件显示详情 -->
      <ApplicationDetailView
        :visible.sync="detailVisible"
        :detail-data="detail"
        title="申请单详情"
        @close="detailVisible = false"
      />

      <!-- 分页 -->
      <pagination />
    </div>
  </div>
</template>

<script>
import crudApplicationForm from '@/api/applicationForm'
import CRUD, { presenter, header, form, crud } from '@crud/crud'
import rrOperation from '@crud/RR.operation'
import crudOperation from '@crud/CRUD.operation'
import pagination from '@crud/Pagination'
import ApplicationDetailView from '@/views/application/summary/ApplicationDetailView.vue'

const defaultForm = {
}

export default {
  name: 'ApplicationForm',
  components: { pagination, crudOperation, rrOperation, ApplicationDetailView },
  mixins: [presenter(), header(), form(defaultForm), crud()],
  cruds() {
    return CRUD({
      title: '申请单接口',
      url: 'api/applicationForm/approved-applications',
      idField: 'id',
      sort: 'id,desc',
      crudMethod: { ...crudApplicationForm },
      optShow: { add: false, edit: false, del: false }
    })
  },
  data() {
    return {
      // 新增：详情相关状态
      detail: {},
      deviceInfo: {},
      detailVisible: false,
      rejectDialogVisible: false,
      rejectReason: '',
      submitLoading: false,
      loadingDeviceInfo: false,
      parsedDeviceInfo: {}, // 存储解析后的设备信息
      approvalHistory: [], // 存储解析后的审批历史记录
      groupedApprovalHistory: [], // 按轮次分组的审批历史记录

      // 申请单状态常量定义
      STATUS_DRAFT: -1,        // 草稿
      STATUS_SUBMITTED: 0,     // 已提交
      STATUS_PENDING: 1,       // 待审批
      STATUS_APPROVED: 2,      // 审批通过
      STATUS_FIRMWARE_VERIFY: 3, // 固件校验中
      STATUS_FIRMWARE_FAILED: 4, // 固件校验失败
      STATUS_SYNCING: 5,       // 同步中
      STATUS_SYNC_FAILED: 6,   // 同步失败
      STATUS_COMPLETED: 7,     // 已完成
      STATUS_REJECTED: 8,      // 已驳回
      STATUS_AUTO_PROCESSING: 9, // 自动处理中
      STATUS_AUTO_FAILED: 10,   // 自动处理失败
      STATUS_MANUAL_TRIGGERED: 11, // 手动触发
      STATUS_WITHDRAWN: 12,    // 已撤回

      // 审批状态常量
      APPROVAL_STATUS_PENDING: 0,
      APPROVAL_STATUS_APPROVED: 1,
      APPROVAL_STATUS_REJECTED: 2,


      permission: {
        add: ['admin', 'applicationForm:add'],
        edit: ['admin', 'applicationForm:edit'],
        del: ['admin', 'applicationForm:del'],
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
  methods: {

    // 开关变化处理
    onSwitchChange() {
      this.updateQuery()
    },

    // 处理点击"查看"
    handleView(row) {
      this.detail = { ...row } // 复制当前行数据
      this.parsedDeviceInfo = {}
      this.loadingDeviceInfo = true
      this.detailVisible = true

      // 解析设备信息
      if (row.dataDetails) {
        try {
          this.parsedDeviceInfo = typeof row.dataDetails === 'string'
            ? JSON.parse(row.dataDetails)
            : row.dataDetails
        } catch (e) {
          console.error('设备信息Details字段不是有效的JSON字符串:', row.dataDetails)
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
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
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
    },
    // 钩子：在获取数据前执行
    [CRUD.HOOK.beforeRefresh]() {
      // 确保每次刷新也遵循当前开关状态
      this.query.approverUserName = this.currentUser
      return true
    },
    // 根据审核状态返回 el-tag 类型

  }
}
</script>

