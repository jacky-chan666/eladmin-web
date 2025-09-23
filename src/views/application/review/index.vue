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


      <!-- 表格渲染 -->
      <el-table ref="table" v-loading="crud.loading" :data="crud.data" size="small" style="width: 100%;" @selection-change="crud.selectionChangeHandler">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="applicationForm.uuid" label="申请单ID" align="center" />
        <el-table-column prop="applicationForm.applicantUserName" label="申请人姓名" align="center" />
        <el-table-column prop="applicationForm.applicationDate" label="申请日期" align="center" />
        <el-table-column prop="applicationForm.applicationType" label="申请单类型" align="center">
          <template slot-scope="scope">
            <div style="text-align: center;">{{ getApplicationTypeName(scope.row.applicationForm.applicationType) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="applicationForm.applicationDataType" label="申请单数据类型" align="center">
          <template slot-scope="scope">
            <div style="text-align: center;">{{ getApplicationDataTypeName(scope.row.applicationForm.applicationDataType) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="applicationForm.applicationTitle" label="申请单标题" align="center" />
        <el-table-column prop="applicationForm.status" label="申请状态" align="center">
          <template slot-scope="scope">
            <div style="text-align: center;">{{ getStatusName(scope.row.applicationForm.status) }}</div>
          </template>
        </el-table-column>
        <!-- 操作列：动态权限控制 -->
        <el-table-column label="操作" width="300px" align="center">
          <template slot-scope="scope">
            <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 8px;">
              <!-- 查看：所有人都可以看（或者你也可以限制权限）除了草稿 -->
              <el-button size="mini" type="text" @click="handleView(scope.row.applicationForm)">查看</el-button>
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
      >
        <div slot="actions">
          <el-button type="success" size="small" @click="handleApprove(detail)">通过</el-button>
          <el-button type="danger" size="small" @click="openRejectDialog(detail)">驳回</el-button>
          <el-button size="small" @click="detailVisible = false">关闭</el-button>
        </div>
      </ApplicationDetailView>

      <el-dialog
        :visible.sync="rejectDialogVisible"
        title="驳回申请"
        width="400px"
        top="30vh"
        center
        :close-on-click-modal="false"
        @closed="onRejectDialogClosed"
      >
        <el-form size="small">
          <el-form-item label="驳回理由" required>
            <el-input
              v-model="rejectReason"
              type="textarea"
              :rows="3"
              placeholder="请填写驳回原因"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>

        <div slot="footer" class="dialog-footer">
          <el-button size="small" @click="onRejectCancel">取消</el-button>
          <el-button size="small" type="primary" :loading="submitLoading" @click="submitReject">
            确定驳回
          </el-button>
        </div>
      </el-dialog>


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
import {approveApplication} from '@/api/applicationForm'
import ApplicationDetailView from '@/views/application/summary/ApplicationDetailView.vue'
import {
  getApplicationTypeName,
  getApplicationDataTypeName,
  getApplicationStatusName,
  getDeviceTypeName,
  APPROVAL_STATUS
} from '@/utils/dataFields'

const defaultForm = {
}

export default {
  name: 'ApplicationForm',
  components: { pagination, crudOperation, rrOperation, ApplicationDetailView },
  mixins: [presenter(), header(), form(defaultForm), crud()],
  cruds() {
    return CRUD({
      title: '申请单接口',
      url: 'api/applicationForm/pending-approvals',
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
      dataDetails: {},
      detailVisible: false,
      rejectDialogVisible: false,
      rejectReason: '',
      submitLoading: false,
      loadingDataDetails: false,
      parsedData: {}, // 存储解析后的设备信息
      approvalHistory: [], // 存储解析后的审批历史记录
      groupedApprovalHistory: [], // 按轮次分组的审批历史记录

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
    // 处理点击"查看"
    handleView(row) {
      this.detail = { ...row } // 复制当前行数据
      this.parsedData = {}
      this.loadingDataDetails = true
      this.detailVisible = true

      // 解析设备信息
      if (row.dataDetails) {
        try {
          this.parsedData = typeof row.dataDetails === 'string'
            ? JSON.parse(row.dataDetails)
            : row.dataDetails
        } catch (e) {
          console.error('设备信息Details字段不是有效的JSON字符串:', row.dataDetails)
          console.error('解析设备信息失败:', e)
          this.parsedData = {}
        }
      }

      // 解析审批历史记录
      this.parseApprovalHistory(row.approvalHistory)

      this.loadingDataDetails = false
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

    // 格式化时间戳
    formatTimestamp(timestamp) {
      if (!timestamp) return '未知时间'
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
    },

    // 获取申请类型名称
    getApplicationTypeName(type) {
      return getApplicationTypeName(type)
    },

    // 获取申请数据类型名称
    getApplicationDataTypeName(type) {
      return getApplicationDataTypeName(type)
    },

    // 获取状态名称（根据后端定义的状态常量）
    getStatusName(status) {
      // 确保状态值为数字类型
      const statusValue = parseInt(status, 10)
      return getApplicationStatusName(statusValue)
    },

    // 获取设备种类名称
    getTypeName(type) {
      return getDeviceTypeName(type)
    },

    openRejectDialog(row) {
      this.detail = { ...row }
      this.rejectDialogVisible = true
      this.rejectReason = ''
      this.submitLoading = false
    },
    onRejectCancel() {
      this.rejectDialogVisible = false
    },

    onRejectDialogClosed() {
      // dialog 完全关闭后清理数据
      this.rejectReason = ''
      this.submitLoading = false
    },
    submitReject() {
      if (!this.rejectReason.trim()) {
        this.$message.warning('请输入驳回理由')
        return
      }

      this.submitLoading = true

      // 调用审批接口（驳回）
      approveApplication(
        this.detail.id,
        this.currentUser,
        APPROVAL_STATUS.REJECTED,
        this.rejectReason.trim()
      )
        .then(() => {
          this.$message.success('已驳回')
          this.detailVisible = false //关闭详情弹窗
          this.rejectDialogVisible = false // 关闭驳回弹窗
          this.crud.toQuery() // 刷新列表
        })
        .catch(err => {
          this.$message.error('提交失败：' + (err.message || '未知错误'))
        })
        .finally(() => {
          this.submitLoading = false
        })
    },
    handleApprove(row) {
      this.$confirm('确定要通过该申请吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 调用审批接口（通过）
        approveApplication(
          row.id,
          this.currentUser,
          APPROVAL_STATUS.APPROVED,
          '同意'
        )
          .then(res => {
            this.$message.success('审批通过')
            this.detailVisible = false
            this.crud.toQuery() // 刷新列表
          })
          .catch(err => {
            this.$message.error('操作失败：' + (err.message || '未知错误'))
          })
      }).catch(() => {
        this.$message.info('已取消')
      })
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
