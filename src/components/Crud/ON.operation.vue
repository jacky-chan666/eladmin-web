<template>
  <div>
    <!-- 添加一个容器div来包裹按钮 -->
    <div class="action-buttons">
      <!-- 上线按钮 -->
      <el-button
        v-permission="permission.online"
        :disabled="isOnlineDisabled"
        size="mini"
        type="success"
        icon="el-icon-upload2"
        class="action-btn online-btn"
        @click.stop="showForm('online')">
        上线
      </el-button>

      <!-- 下线按钮 -->
      <el-button
        v-permission="permission.offline"
        :disabled="disabledOffline"
        size="mini"
        type="warning"
        icon="el-icon-download"
        class="action-btn offline-btn"
        @click.stop="showForm('offline')">
        下线
      </el-button>
    </div>


    <!-- 统一的操作表单弹窗 -->
    <el-dialog
      :visible.sync="formVisible"
      :title="dialogTitle"
      center
      width="55%"
      top="3vh"
      style="min-width: 900px;"
      @close="handleClose"
    >
      <el-form ref="form" :model="form"  :rules="rules" size="small" label-width="100px">

        <!-- 在设备信息卡片之前添加申请信息卡片 -->
        <el-card shadow="never" style="margin-bottom: 20px;">
          <div slot="header" style="font-weight: bold; font-size: 16px;">申请信息</div>
          <el-row :gutter="20">
            <!-- 申请单编号 -->
            <el-col :span="12">
              <el-form-item label="申请单编号">
                <el-input v-model="form.uuid" disabled style="width: 100%;" />
              </el-form-item>
            </el-col>

            <!-- 申请人 -->
            <el-col :span="12">
              <el-form-item label="申请人">
                <el-input v-model="form.applicantUserName" disabled style="width: 100%;" />
              </el-form-item>
            </el-col>

            <!-- 申请单标题 -->
            <el-col :span="24">
              <el-form-item label="申请单标题" prop="applicationTitle">
                <el-input v-model="form.applicationTitle" placeholder="请输入申请单标题" style="width: 100%;" />
              </el-form-item>
            </el-col>

            <!-- 申请理由 -->
            <el-col :span="24">
              <el-form-item label="申请理由" prop="applicationReason">
                <el-input
                  v-model="form.applicationReason"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入申请理由"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <!-- 设备信息区块 -->
        <el-card shadow="never" style="margin-bottom: 20px;">
          <div slot="header" style="font-weight: bold; font-size: 16px;">设备信息</div>
          <el-row :gutter="20">
            <!-- 动态设备信息字段 -->
            <template v-if="dataFields && dataFields.length > 0">
              <el-col
                v-for="(field, index) in dataFields"
                :key="index"
                :span="field.span || 12"
              >
                <el-form-item v-if="field.required" :label="field.label" :prop="'dataDetails.' + field.prop" >
                  <!-- 输入框 -->
                  <el-input
                    v-if="field.type === 'input' || !field.type"
                    v-model="form.dataDetails[field.prop]"
                    :placeholder="field.placeholder"
                    style="width: 100%;"
                    disabled
                  />
                  <!-- 下拉选择框 -->
                  <el-select
                    v-else-if="field.type === 'select'"
                    v-model="form.dataDetails[field.prop]"
                    :placeholder="field.placeholder"
                    style="width: 100%;"
                    disabled
                  >
                    <el-option
                      v-for="option in field.options"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                      disabled
                    />
                  </el-select>
                  <!-- 文本域 -->
                  <el-input
                    v-else-if="field.type === 'textarea'"
                    v-model="form.dataDetails[field.prop]"
                    type="textarea"
                    :rows="field.rows || 4"
                    :placeholder="field.placeholder"
                    style="width: 100%;"
                    disabled
                  />
                </el-form-item>
              </el-col>
            </template>
            <template v-else>
              <!-- 当没有提供字段配置时的默认提示 -->
              <el-col :span="24">
                <div style="text-align: center; color: #999; padding: 20px;">
                  未配置设备信息字段
                </div>
              </el-col>
            </template>
          </el-row>
        </el-card>


        <!-- 审核信息区块 -->
        <el-card v-if="showApprovalSection" shadow="never" style="margin-bottom: 20px;">
          <div slot="header" style="font-weight: bold; font-size: 16px;">审核信息</div>
          <el-row :gutter="20">

            <!-- 第一行：研发接口人 + 设备接口人 -->
            <el-col :span="12">
              <el-form-item label="研发接口人" prop="devContact">
                <el-select v-model="form.devContact" filterable placeholder="请选择" size="small" style="width: 100%;">
                  <el-option v-for="user in devContactUsers" :key="user.id" :label="user.username" :value="user.username" />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="测试接口人" prop="testContact">
                <el-select v-model="form.testContact" filterable placeholder="请选择" size="small" style="width: 100%;">
                  <el-option v-for="user in testContactUsers" :key="user.id" :label="user.username" :value="user.username" />
                </el-select>
              </el-form-item>
            </el-col>

            <!-- 第二行：研发组长 + 设备组长 -->
            <el-col :span="12">
              <el-form-item label="研发组长" prop="devLeader">
                <el-select v-model="form.devLeader" filterable placeholder="请选择" size="small" style="width: 100%;">
                  <el-option v-for="user in devLeaderUsers" :key="user.id" :label="user.username" :value="user.username" />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="测试组长" prop="testLeader">
                <el-select v-model="form.testLeader" filterable placeholder="请选择" size="small" style="width: 100%;">
                  <el-option v-for="user in testLeaderUsers" :key="user.id" :label="user.username" :value="user.username" />
                </el-select>
              </el-form-item>
            </el-col>


          </el-row>
        </el-card>

      </el-form>

      <!-- 在 dialog 的 footer 中添加提交申请按钮 -->
      <div slot="footer" class="dialog-footer">
        <el-button type="text" @click="handleClose">取消</el-button>
        <el-button :loading="submitLoading" type="primary" @click="handleSubmit">提交申请</el-button>
      </div>

    </el-dialog>
  </div>
</template>

<script>
import CRUD, { crud } from '@crud/crud'
import { getAll } from '@/api/system/role'
import { getUsersByRoleId } from '@/api/system/user'
import { submitApplication, saveDraft } from '@/api/applicationForm'


// 更新默认表单值
const defaultForm = {
  id: null,
  uuid: null,
  applicationTitle: null,
  applicationReason: null,
  applicationType: null, // 1:新增, 2:编辑, 3:上线, 4:下线
  applicationDataType: null, // 区分不同的数据类型
  applicationDataId: null, // 数据表的主键ID
  applicantUserName: '',
  devContact: null,
  testContact: null,
  devLeader: null,
  testLeader: null,
  dataDetails: {}
}

export default {
  mixins: [crud()],
  props: {
    formData: {
      type: Object,
      default: () => ({})
    },
    mode: {
      type: String,
      default: 'online' // 'add' 或 'edit'
    },
    showApprovalSection: {
      type: Boolean,
      default: true
    },
    devContactUsers: {
      type: Array,
      default: () => []
    },
    testContactUsers: {
      type: Array,
      default: () => []
    },
    devLeaderUsers: {
      type: Array,
      default: () => []
    },
    testLeaderUsers: {
      type: Array,
      default: () => []
    },
    // 新增：设备信息字段配置
    dataFields: {
      type: Array,
      default: () => []
    },
    // 新增：设备数据类型，用于区分不同设备类型
    applicationDataType: {
      type: Number,
      default: 1
    },
    data: { type: Object, required: true },
    permission: { type: Object, required: true },
    disabledOnline: { type: Boolean, default: false },
    disabledOffline: { type: Boolean, default: false }
  },
  data() {
    return {
      formVisible: false,
      operationType: '', // 'online' 或 'offline'
      form: {},
      rules: {
        applicationTitle: [{ required: true, message: '申请单标题不能为空', trigger: 'blur' }],
        applicationReason: [{ required: true, message: '申请理由不能为空', trigger: 'blur' }],
        reason: [{ required: true, message: '请输入理由', trigger: 'blur' }],
        applicant: [{ required: true, message: '申请人不能为空', trigger: 'blur' }],
        devContact: [{ required: true, message: '请选择研发接口人', trigger: 'change' }],
        testContact: [{ required: true, message: '请选择设备接口人', trigger: 'change' }],
        devLeader: [{ required: true, message: '请选择研发组长', trigger: 'change' }],
        testLeader: [{ required: true, message: '请选择测试组长', trigger: 'change' }]
      }
    }
  },
  watch: {
    formData: {
      handler(newVal) {
        if (newVal && Object.keys(newVal).length > 0) {
          // 使用深拷贝确保不会影响原始数据
          const newData = JSON.parse(JSON.stringify(newVal))
          this.form = { ...defaultForm, ...newData }
        } else if (!newVal || Object.keys(newVal).length === 0) {
          // 如果没有传入数据，则重置为默认表单
          this.resetForm()
        }
      },
      immediate: true,
      deep: true
    },
    visible(newVal) {
      if (newVal) {
        // 如果没有传入审批人列表，则加载审批人列表
        if (this.devContactUsers.length === 0 &&
          this.testContactUsers.length === 0 &&
          this.devLeaderUsers.length === 0 &&
          this.testLeaderUsers.length === 0) {
          this.loadApproverUsersByRoles()
        }
      }
    },
    // 监听表单变化，防止设备详情被重置
    'form.dataDetails': {
      handler(newVal) {
        // 确保 dataDetails 始终是一个对象
        if (!newVal) {
          this.$set(this.form, 'dataDetails', { ...defaultForm.dataDetails })
        }
      },
      deep: true
    }
  },
  computed: {
    isOnlineDisabled() {
      return false
    },
    dialogTitle() {
      return this.operationType === 'online' ? '上线确认' : '下线确认'
    },
    reasonLabel() {
      return this.operationType === 'online' ? '上线理由' : '下线理由'
    },
    reasonPlaceholder() {
      return this.operationType === 'online'
        ? '请说明本次上线的原因和变更内容'
        : '请说明本次下线的原因'
    }
  },
  methods: {
    showForm(type) {
      this.operationType = type
      this.formVisible = true
      this.loadApproverUsersByRoles()

      // 清空校验状态
      this.$nextTick(() => {
        if (this.$refs.formRef) {
          this.$refs.formRef.clearValidate()
        }
      })
    },

    // 在 methods 中添加新的实现方法
    async loadApproverUsersByRoles() {
      try {
        // 获取所有角色
        const rolesRes = await getAll()
        const roles = rolesRes.content || rolesRes

        // 找到对应的角色ID
        const devContactRole = roles.find(role => role.name.includes('研发接口人'))
        const testContactRole = roles.find(role => role.name.includes('测试接口人'))
        const devLeaderRole = roles.find(role => role.name.includes('研发组长'))
        const testLeaderRole = roles.find(role => role.name.includes('测试组长'))

        // 根据角色ID获取对应的用户（如果后端支持按角色查询用户）
        if (devContactRole) {
          const users = await getUsersByRoleId(devContactRole.id)
          this.devContactUsers = users.content || users
        }

        if (testContactRole) {
          const users = await getUsersByRoleId(testContactRole.id)
          this.testContactUsers = users.content || users
        }

        if (devLeaderRole) {
          const users = await getUsersByRoleId(devLeaderRole.id)
          this.devLeaderUsers = users.content || users
        }

        if (testLeaderRole) {
          const users = await getUsersByRoleId(testLeaderRole.id)
          this.testLeaderUsers = users.content || users
        }

        // 触发事件，通知父组件更新审批人列表
        this.$emit('update-approver-users', {
          devContactUsers: this.devContactUsers,
          testContactUsers: this.testContactUsers,
          devLeaderUsers: this.devLeaderUsers,
          testLeaderUsers: this.testLeaderUsers
        })
      } catch (error) {
        console.error('获取审批人列表失败:', error)
        this.$message.error('获取审批人列表失败')
      }
    },

    handleClose() {
      if (this.$refs.formRef) {
        this.$refs.formRef.resetFields()
      }
      this.formVisible = false
    },

    cancel() {
      this.formVisible = false
    },
    async handleSubmit() {
      try {
        // 验证表单
        await this.$refs.form.validate()

        this.submitLoading = true

        // 构造提交数据
        const submitData = {
          ...this.form,
          dataDetails: JSON.stringify(this.form.dataDetails),
          applicationType: this.getApplicationType()
        }

        await submitApplication(submitData)
        this.$message.success('申请提交成功')
        this.$emit('submit-success')
        this.handleClose()
      } catch (error) {
        console.error('提交申请失败', error)
        this.$message.error('提交申请失败')
      } finally {
        this.submitLoading = false
      }
    },
    getApplicationType() {
      // 根据操作状态确定申请类型
      if (this.operationType === 'online') {
        return 3 // 上线
      } else if (this.operationType === 'offline') {
        return 4 // 下线
      }
      return null
    },
  }
}
</script>

<style scoped>/* 容器级控制：使用 flex 强制对齐 */
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: nowrap;
  width: 100%;
  max-width: 150px; /* 限制最大宽度 */
  margin: 0 auto;
}

/* 图标对齐修复 */
.action-btn i.el-icon-upload2,
.action-btn i.el-icon-download {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 14px !important;
  height: 14px !important;
  margin-right: 4px !important;
  vertical-align: middle !important;
}

/* 统一操作按钮样式 */
.action-btn {
  margin: 0;
  font-size: 12px;
  border-radius: 4px;
  transition: all 0.3s ease;
  flex: 1; /* 平均分配空间 */
  min-width: 0; /* 允许按钮收缩 */
  padding: 4px 8px; /* 减小内边距 */
}

/* 鼠标悬停效果（启用状态） */
.action-btn:not(.is-disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

/* 上线按钮 - 启用状态 */
.online-btn:not(.is-disabled) {
  background-color: #67c23a;
  border-color: #67c23a;
  color: #fff;
}

.online-btn:not(.is-disabled):hover {
  background-color: #5daf34;
  border-color: #5daf34;
}

/* 下线按钮 - 启用状态 */
.offline-btn:not(.is-disabled) {
  background-color: #e6a23c;
  border-color: #e6a23c;
  color: #fff;
}

.offline-btn:not(.is-disabled):hover {
  background-color: #d4902a;
  border-color: #d4902a;
}

/* 所有禁用状态的统一强化样式 */
.action-btn.is-disabled,
.action-btn.is-disabled:hover {
  /* 强化禁用背景色和边框 */
  background-color: #f0f0f0 !important;
  border-color: #dcdfe6 !important;
  color: #909399 !important;

  /* 图标更灰 */
  opacity: 0.65;
  cursor: not-allowed !important;

  /* 去除悬停阴影 */
  transform: none !important;
  box-shadow: none !important;
}

/* 可选：进一步强化图标颜色（针对 i 标签或 svg） */
.action-btn.is-disabled .el-icon-upload2,
.action-btn.is-disabled .el-icon-download {
  color: #c0c4cc !important;
}
</style>


