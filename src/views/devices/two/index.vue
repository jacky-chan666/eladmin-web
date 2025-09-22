<template>
  <div class="app-container">
    <!--工具栏-->
    <div class="head-container">
      <div v-if="crud.props.searchToggle">
        <!-- 搜索 -->
        <label class="el-form-item-label">模型类型</label>
        <el-input v-model="query.model" clearable placeholder="模型类型" style="width: 185px;" class="filter-item" @keyup.enter.native="crud.toQuery" />
        <label class="el-form-item-label">模型版本</label>
        <el-input v-model="query.modelVersion" clearable placeholder="模型版本" style="width: 185px;" class="filter-item" @keyup.enter.native="crud.toQuery" />
        <rrOperation :crud="crud" />
      </div>

      <!-- CRUD 操作按钮 -->
      <crudOperation :permission="permission" />

      <!-- 使用新的表单组件 -->
      <application-form-dialog
        :visible.sync="formDialogVisible"
        :form-data="currentFormData"
        :mode="formMode"
        :show-approval-section="true"
        :dev-contact-users="devContactUsers"
        :test-contact-users="testContactUsers"
        :dev-leader-users="devLeaderUsers"
        :test-leader-users="testLeaderUsers"
        :data-fields="dataFields"
        :application-data-type="2"
        @close="handleFormClose"
        @save-success="handleSaveSuccess"
        @submit-success="handleSubmitSuccess"
        @update-approver-users="handleUpdateApproverUsers"
      />

      <!-- 表格渲染 -->
      <el-table ref="table" v-loading="crud.loading" :data="crud.data" size="small" style="width: 100%;" @selection-change="crud.selectionChangeHandler">
        <el-table-column type="selection" width="55" />
        <el-table-column
          v-for="(field, index) in dataFields"
          :key="index"
          :prop="field.prop"
          :label="field.label" />
        <el-table-column v-if="checkPer(['admin','gatewayInfo:edit','gatewayInfo:del'])" label="操作" width="150px" align="center">
          <template slot-scope="scope">
            <onOperation
              :form-data="scope.row"
              :permission="permission"
            />
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <pagination />
    </div>
  </div>
</template>


<script>
import crudGatewayInfo from '@/api/gatewayInfo'
import CRUD, { presenter, header, form, crud } from '@crud/crud'
import rrOperation from '@crud/RR.operation'
import crudOperation from '@crud/CRUD.operation'
import onOperation from '@crud/ON.operation'
import pagination from '@crud/Pagination'
import ApplicationFormDialog from '@/views/application/summary/ApplicationFormDialog.vue'
import { dataType2Fields } from '@/utils/dataFields'


// 更新默认表单值
const defaultForm = {
  id: null,
  uuid: null,
  applicationTitle: null,
  applicationReason: null,
  applicationType: null, // 1:新增, 2:编辑, 3:上线, 4:下线
  applicationDataType: 2, // 默认为2
  applicantUserName: '',
  devContact: null,
  testContact: null,
  devLeader: null,
  testLeader: null,
  dataDetails: {
    model: null,
    modelVersion: null,
    sbname: null,
    type: null,
    manufacturer: null,
    specifications: null,
    status: null,
    createdAt: null
  }
}

export default {
  name: 'GatewayInfo',
  components: { pagination, crudOperation, rrOperation, onOperation, ApplicationFormDialog },
  mixins: [presenter(), header(), form(defaultForm), crud()],
  cruds() {
    return CRUD({
      title: '网关信息',
      url: 'api/gatewayInfo',
      idField: 'id',
      sort: 'id,desc',
      crudMethod: { ...crudGatewayInfo },
      optShow: { add: true, edit: true, del: false }
    })
  },
  data() {
    return {
      formDialogVisible: false,
      formMode: 'add', // 'add' 或 'edit'
      currentFormData: {}, // 当前表单数据
      permission: {
        add: ['admin', 'gatewayInfo:add'],
        edit: ['admin', 'gatewayInfo:edit'],
        del: ['admin', 'gatewayInfo:del'],
        online: ['admin', 'gatewayInfo:online'],
        offline: ['admin', 'gatewayInfo:offline']
      },
      // 存储各角色的用户列表
      devContactUsers: [],
      testContactUsers: [],
      devLeaderUsers: [],
      testLeaderUsers: [],

      // 设备信息字段配置
      dataFields: dataType2Fields,

      queryTypeOptions: [
        { key: 'model', display_name: '模型类型' },
        { key: 'modelVersion', display_name: '模型版本' }
      ]
    }
  },

  methods: {
    handleSaveSuccess() {
      this.formDialogVisible = false
      this.crud.toQuery()
    },

    handleSubmitSuccess() {
      this.formDialogVisible = false
      this.crud.toQuery()
    },

    handleFormClose() {
      this.formDialogVisible = false
      this.currentFormData = {}
    },

    handleUpdateApproverUsers(users) {
      this.devContactUsers = users.devContactUsers
      this.testContactUsers = users.testContactUsers
      this.devLeaderUsers = users.devLeaderUsers
      this.testLeaderUsers = users.testLeaderUsers
    },

    // 在打开表单前填充申请人信息
    [CRUD.HOOK.beforeToCU](crud, data) {
      // 从 Vuex 获取申请人（例如用户名）
      const applicantUserName = this.$store.getters.user.username || '系统用户'
      this.form.applicantUserName = applicantUserName

      // 设置表单模式
      this.formMode = crud.status.add === 1 ? 'add' : 'edit'

      // 如果是编辑模式，设置当前表单数据
      if (this.formMode === 'edit' && data) {
        // 将扁平的设备数据结构转换为嵌套结构
        const dataDetails = {
          model: data.model,
          modelVersion: data.modelVersion,
          sbname: data.sbname,
          type: data.type,
          manufacturer: data.manufacturer,
          specifications: data.specifications,
          status: data.status,
          createdAt: data.createdAt
        }

        // 设置当前表单数据
        this.currentFormData = {
          ...data,
          applicationDataId: data.id,
          id: null,
          dataDetails
        }
      } else {
        // 新增模式，清空当前表单数据
        this.currentFormData = {}
      }

      // 显示表单对话框
      this.formDialogVisible = true

      return false // 阻止默认的表单弹出
    },

    // 钩子：刷新前
    [CRUD.HOOK.beforeRefresh]() {
      return true
    }
  }
}
</script>

<style scoped>
/* 可以根据需要添加样式 */
</style>
