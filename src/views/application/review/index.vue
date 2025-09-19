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
        <el-table-column type="selection" width="55" />
        <el-table-column prop="applicationForm.applicantId" label="申请单ID" />
        <el-table-column prop="applicationForm.applicantName" label="申请人姓名" />
        <el-table-column prop="applicationForm.applicationDate" label="申请日期" />
        <el-table-column prop="applicationForm.applicationType" label="申请单类型" />
        <el-table-column prop="applicationForm.applicationDataType" label="申请单数据类型" />
        <el-table-column prop="applicationForm.applicationTitle" label="申请单标题" />
        <el-table-column prop="applicationForm.status" label="申请状态" />
        <!-- 操作列：动态权限控制 -->
        <el-table-column label="操作" width="300px" align="left">
          <template slot-scope="scope">
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              <!-- 查看：所有人都可以看（或者你也可以限制权限）除了草稿 -->
              <el-button v-if="scope.row.status !== 0" size="mini" type="text" @click="handleView(scope.row)">查看</el-button>

              <!-- 只有本人的申请单才显示其他操作按钮 -->
              <template v-if="isSelf(scope.row)">
                <!-- 填写：status === 0 -->
                <el-button v-if="scope.row.status === 0" size="mini" type="text" @click="handleFill(scope.row)">填写</el-button>

                <!-- 删除：status === 0 -->
                <el-button v-if="scope.row.status === 0" size="mini" type="text" style="color: #E53935;" @click="handleDelete(scope.row)">删除</el-button>

                <!-- 撤回：status === 1 -->
                <el-button v-if="scope.row.status === 1" size="mini" type="text" style="color: #FFA000;" @click="handleWithdraw(scope.row)">撤回</el-button>

                <!-- 重新填写：status === 10 -->
                <el-button v-if="scope.row.status === 10" size="mini" type="text" @click="handleRefill(scope.row)">重新填写</el-button>

                <!-- 固件校验：status === 5 -->
                <el-button v-if="scope.row.status === 5" size="mini" type="text" style="color: #4CAF50;" @click="handleFirmwareCheck(scope.row)">固件校验</el-button>

                <!-- 发布同步：status === 6 或 7 -->
                <el-button
                  v-if="scope.row.status === 6 || scope.row.status === 7"
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
          <!-- Tab 1: 单据信息 -->
          <el-tab-pane label="单据信息">
            <el-descriptions :column="1" border size="medium">
              <el-descriptions-item label="申请单ID">{{ detail.uuid }}</el-descriptions-item>
              <el-descriptions-item label="申请人">{{ detail.applicantUserName }}</el-descriptions-item>
              <el-descriptions-item label="表单标题">{{ detail.applicationTitle }}</el-descriptions-item>
              <el-descriptions-item label="申请日期">{{ detail.applicationDate }}</el-descriptions-item>
              <el-descriptions-item label="申请类型">{{ detail.applicationType }}</el-descriptions-item>
              <el-descriptions-item label="数据类型">{{ detail.applicationDataType }}</el-descriptions-item>
              <el-descriptions-item label="申请状态">{{ detail.status }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <!-- Tab 2: 设备信息 -->
          <el-tab-pane label="设备信息">
            <div v-if="loadingDeviceInfo">正在加载设备信息...</div>
            <el-descriptions v-else :column="1" border size="medium">
              <el-descriptions-item label="设备型号">{{ deviceInfo.deviceModel || '暂无' }}</el-descriptions-item>
              <el-descriptions-item label="设备版本">{{ deviceInfo.deviceVersion || '暂无' }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <!-- Tab 3: 审核信息 -->
          <el-tab-pane label="审核信息">
            <el-descriptions :column="1" border size="medium">
              <!-- 测试接口人 -->
              <el-descriptions-item label="测试接口人">
                <span>{{ detail.testContact }}</span>


                <strong>审核状态：</strong><el-tag :type="approvalTag(detail.testContactApproval)">{{ detail.testContactApproval }}</el-tag>


                <strong>审核意见：</strong>{{ detail.testContactComment || '无' }}
              </el-descriptions-item>

              <!-- 研发接口人 -->
              <el-descriptions-item label="研发接口人">
                <span>{{ detail.devContact }}</span>


                <strong>审核状态：</strong><el-tag :type="approvalTag(detail.devContactApproval)">{{ detail.devContactApproval }}</el-tag>


                <strong>审核意见：</strong>{{ detail.devContactComment || '无' }}
              </el-descriptions-item>

              <!-- 测试组长 -->
              <el-descriptions-item label="测试组长">
                <span>{{ detail.testLeader }}</span>


                <strong>审核状态：</strong><el-tag :type="approvalTag(detail.testLeaderApproval)">{{ detail.testLeaderApproval }}</el-tag>


                <strong>审核意见：</strong>{{ detail.testLeaderComment || '无' }}
              </el-descriptions-item>

              <!-- 研发组长 -->
              <el-descriptions-item label="研发组长">
                <span>{{ detail.devLeader }}</span>


                <strong>审核状态：</strong><el-tag :type="approvalTag(detail.devLeaderApproval)">{{ detail.devLeaderApproval }}</el-tag>


                <strong>审核意见：</strong>{{ detail.devLeaderComment || '无' }}
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
        </el-tabs>

        <!-- 底部按钮 -->
        <div slot="footer" class="dialog-footer">
          <el-button type="success" size="small" @click="handleApprove(detail)">通过</el-button>
          <el-button type="danger" size="small" @click="openRejectDialog(detail)">驳回</el-button>
          <el-button size="small" @click="detailVisible = false">关闭</el-button>
        </div>

      </el-dialog>

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
import crudDeviceApplicationForm from '@/api/deviceApplicationForm'
import CRUD, { presenter, header, form, crud } from '@crud/crud'
import rrOperation from '@crud/RR.operation'
import crudOperation from '@crud/CRUD.operation'
import pagination from '@crud/Pagination'



const defaultForm = {
  id: null,
  uuid: null,
  applicantUserName: null,
  department: null,
  applicationDate: null,
  applicationDataId: null,
  applicationType: null,
  applicationDataType: null,
  applicationTitle: null,
  applicationReason: null,
  status: null,
  testContact: null,
  testLeader: null,
  devContact: null,
  devLeader: null,
  testContactApproval: null,
  testLeaderApproval: null,
  devContactApproval: null,
  devLeaderApproval: null,
  testContactComment: null,
  testLeaderComment: null,
  devContactComment: null,
  devLeaderComment: null,
  currentApprovers: null,
  approvalHistory: null,
  createdAt: null,
  updatedAt: null
}

export default {
  name: 'DeviceApplicationForm',
  components: { pagination, crudOperation, rrOperation },
  mixins: [presenter(), header(), form(defaultForm), crud()],
  cruds() {
    return CRUD({
      title: '申请单接口',
      url: 'api/deviceApplicationForm/pending-approvals',
      idField: 'id',
      sort: 'id,desc',
      crudMethod: { ...crudDeviceApplicationForm },
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
      permission: {
        add: ['admin', 'deviceApplicationForm:add'],
        edit: ['admin', 'deviceApplicationForm:edit'],
        del: ['admin', 'deviceApplicationForm:del'],
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
    isSelf(row) {
      const currentUsername = this.$store.getters.user.username
      return row.applicantUserName === currentUsername
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

      const formData = {
        id: this.detail.id,
        approverName: this.currentUser,
        approvalStatus: '驳回',
        approvalComment: this.rejectReason.trim()
      }

      // 调用审批接口
      crudDeviceApplicationForm.approve(formData)
        .then(() => {
          this.$message.success('已驳回')
          this.detailVisible = false      // 关闭详情弹窗
          this.rejectDialogVisible = false // 关闭驳回弹窗
          this.crud.toQuery()            // 刷新列表
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
        const form = {
          id: row.id,
          approverName: this.currentUser,
          approvalStatus: '通过',
          approvalComment: '同意' // 默认意见
        }

        crudDeviceApplicationForm.approve(form)
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

    // 开关变化处理
    onSwitchChange() {
      this.updateQuery()
    },

    // 钩子：在获取数据前执行
    [CRUD.HOOK.beforeRefresh]() {
      // 确保每次刷新也遵循当前开关状态
      this.query.approverName = this.currentUser
      return true
    },

    // ============ 新增方法 ============

    // 处理点击“查看”
    handleView(row) {
      this.detail = { ...row } // 复制当前行数据
      this.deviceInfo = {}
      this.loadingDeviceInfo = true
      this.detailVisible = true

      // 调用接口获取设备信息
      // axios.get('/api/deviceInfo', {
      //   params: { applicationId: row.applicantId } // 假设 applicantId 是唯一标识
      // })
      //   .then(res => {
      //     this.deviceInfo = res.data || {}
      //   })
      //   .catch(err => {
      //     console.error('获取设备信息失败:', err)
      //     this.$message.warning('未能获取设备信息')
      //   })
      //   .finally(() => {
      //     this.loadingDeviceInfo = false
      //   })
    },

    // 根据审核状态返回 el-tag 类型
    approvalTag(status) {
      if (!status) return ''
      switch (status) {
        case '通过': return 'success'
        case '驳回': return 'danger'
        case '待审核': return 'warning'
        default: return 'info'
      }
    },

  },
  // mounted() {
  //   // 初始化查询
  //   this.updateQuery()
  // }
}
</script>
