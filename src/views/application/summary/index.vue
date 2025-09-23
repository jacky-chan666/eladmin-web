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
              <el-button v-if="scope.row.status !== APPLICATION_STATUS.DRAFT" size="mini" type="text" @click="handleView(scope.row)">查看</el-button>

              <!-- 只有本人的申请单才显示其他操作按钮 -->
              <template v-if="isSelf(scope.row)">
                <!-- 填写：草稿状态 -->
                <el-button v-if="scope.row.status === APPLICATION_STATUS.DRAFT" size="mini" type="text" @click="handleFill(scope.row)">填写</el-button>

                <!-- 删除：草稿状态 -->
                <el-button
                  v-if="scope.row.status === APPLICATION_STATUS.DRAFT"
                  size="mini"
                  type="text"
                  style="color: #E53935;"
                  @click="handleDelete(scope.row)"
                >
                  删除
                </el-button>

                <!-- 撤回：已提交状态 -->
                <el-button v-if="scope.row.status === APPLICATION_STATUS.SUBMITTED || scope.row.status === APPLICATION_STATUS.FIRMWARE_FAILED || scope.row.status === APPLICATION_STATUS.FIRMWARE_FAILED || scope.row.status === APPLICATION_STATUS.SYNC_FAILED" size="mini" type="text" style="color: #FFA000;" @click="handleWithdraw(scope.row)">撤回</el-button>

                <!-- 重新填写：已驳回状态 -->
                <el-button
                  v-if="scope.row.status === APPLICATION_STATUS.REJECTED || scope.row.status === APPLICATION_STATUS.WITHDRAWN"
                  size="mini"
                  type="text"
                  @click="handleFill(scope.row)"
                >
                  重新填写
                </el-button>

                <!-- 固件校验：固件校验中状态 -->
                <el-button v-if="scope.row.status === APPLICATION_STATUS.FIRMWARE_VERIFY" size="mini" type="text" style="color: #4CAF50;" @click="handleFirmwareCheck(scope.row)">固件校验</el-button>

                <!-- 发布同步：同步中或同步失败状态 -->
                <el-button
                  v-if="scope.row.status === APPLICATION_STATUS.SYNCING || scope.row.status === APPLICATION_STATUS.SYNC_FAILED"
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
      <ApplicationDetailView
        :visible.sync="detailVisible"
        :detail-data="detail"
        title="申请单详情"
        @close="detailVisible = false"
      />


      <!-- 申请单表单弹窗 -->
      <ApplicationFormDialog
        :visible.sync="formDialogVisible"
        :form-data="currentFormData"
        :application-data-type="currentApplicationDataType"
        :data-fields="currentDataFields"
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
import crudApplicationForm from '@/api/applicationForm.js'
import CRUD, { presenter, header, form, crud } from '@crud/crud'
import rrOperation from '@crud/RR.operation'
import crudOperation from '@crud/CRUD.operation'
import pagination from '@crud/Pagination'
import ApplicationFormDialog from './ApplicationFormDialog.vue'
import ApplicationDetailView from './ApplicationDetailView.vue'
import { withdrawApplication, deleteApplicationForm } from '@/api/applicationForm'
import {
  getDataFieldsByType,
  APPLICATION_STATUS,
  getApplicationTypeName,
  getApplicationDataTypeName,
  getApplicationStatusName,
  getApprovalStatusName
} from '@/utils/dataFields'

const defaultForm = {

}

export default {
  name: 'ApplicationForm',
  components: { pagination, crudOperation, rrOperation, ApplicationFormDialog, ApplicationDetailView },
  mixins: [presenter(), header(), form(defaultForm), crud()],
  cruds() {
    return CRUD({
      title: '申请单接口',
      url: 'api/applicationForm',
      idField: 'id',
      sort: 'id,desc',
      crudMethod: { ...crudApplicationForm },
      optShow: { add: false, edit: false, del: false }
    })
  },
  data() {
    return {
      // 新增：详情相关状态
      detailVisible: false,
      detail: {},

      // 表单弹窗相关
      formDialogVisible: false,
      currentFormData: {},
      currentApplicationDataType: 1, // 当前申请单的设备数据类型
      currentDataFields: [], // 当前设备字段配置

      permission: {
        add: ['admin', 'applicationForm.js:add'],
        edit: ['admin', 'applicationForm.js:edit'],
        del: ['admin', 'applicationForm.js:del']
      },
      rules: {
        uuid: [{ required: true, message: '申请单不能为空', trigger: 'blur' }],
        applicantUserName: [{ required: true, message: '申请人姓名不能为空', trigger: 'blur' }],
        applicationDate: [{ required: true, message: '申请日期不能为空', trigger: 'blur' }],
        applicationType: [{ required: true, message: '申请单类型', trigger: 'blur' }],
        applicationDataType: [{ required: true, message: '申请单数据类型', trigger: 'blur' }],
        applicationTitle: [{ required: true, message: '申请单标题不能为空', trigger: 'blur' }],
        applicationReason: [{ required: true, message: '申请理由不能为空', trigger: 'blur' }]
      },
      showAll: false, // 控制是否显示全部申请单
      // 导入常量以便在模板中使用
      APPLICATION_STATUS: APPLICATION_STATUS
    }
  },
  methods: {
    // 获取申请单类型名称
    getApplicationTypeName(type) {
      return getApplicationTypeName(type)
    },

    // 获取申请单数据类型名称
    getApplicationDataTypeName(type) {
      return getApplicationDataTypeName(type)
    },

    // 获取申请状态名称
    getStatusName(status) {
      return getApplicationStatusName(status)
    },

    // 获取审批状态名称
    getApprovalStatusName(status) {
      return getApprovalStatusName(status)
    },
    // 判断是否为本人的申请单
    isSelf(row) {
      // 从 Vuex store 获取当前用户信息
      const currentUser = this.$store.getters.user
      return row.applicantUserName === currentUser.username
    },

    // 处理查看详情
    handleView(row) {
      this.detail = { ...row }
      this.detailVisible = true
    },

    // 处理填写/重新填写申请单
    handleFill(row) {
      // 设置当前申请单的设备数据类型
      this.currentApplicationDataType = row.applicationDataType || 1

      // 根据设备数据类型获取字段配置
      this.currentDataFields = getDataFieldsByType(this.currentApplicationDataType)

      // 构造表单数据
      let dataDetails = {}
      if (row.dataDetails) {
        try {
          dataDetails = JSON.parse(row.dataDetails)
        } catch (e) {
          console.error('解析设备信息失败:', e)
        }
      }

      // 设置当前表单数据
      this.currentFormData = {
        ...row,
        dataDetails
      }

      // 显示表单弹窗
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

    // 处理固件校验
    handleFirmwareCheck(row) {
      this.$confirm('确定要进行固件校验吗？', '固件校验', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 这里应该调用固件校验接口
        this.$message.success('固件校验已启动')
        this.crud.toQuery() // 刷新列表
      }).catch(() => {
        // 用户取消操作
        this.$message.info('已取消固件校验')
      })
    },

    // 处理发布同步
    handlePublishSync(row) {
      this.$confirm('确定要进行发布同步吗？', '发布同步', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 这里应该调用发布同步接口
        this.$message.success('发布同步已启动')
        this.crud.toQuery() // 刷新列表
      }).catch(() => {
        // 用户取消操作
        this.$message.info('已取消发布同步')
      })
    },

    // 切换显示全部开关
    onSwitchChange(value) {
      // 根据开关状态调整查询条件
      if (value) {
        // 显示全部，清除申请人过滤条件
        delete this.query.applicantUserName
      } else {
        // 只显示本人的，设置申请人过滤条件
        const currentUser = this.$store.getters.user
        this.query.applicantUserName = currentUser.username
      }
      this.crud.toQuery()
    },

    // 钩子：首次加载前
    [CRUD.HOOK.beforeRefresh]() {
      // 如果不是显示全部，则只查询当前用户的数据
      if (!this.showAll) {
        const currentUser = this.$store.getters.user
        this.query.applicantUserName = currentUser.username
      }
      return true
    }
  }
}
</script>

<style scoped>
/* 可以根据需要添加样式 */
</style>

