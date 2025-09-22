<template>
  <el-dialog
    :close-on-click-modal="false"
    :before-close="handleClose"
    :visible.sync="dialogVisible"
    :title="title"
    width="55%"
    top="3vh"
    style="min-width: 900px;"
  >
    <el-form ref="form" :model="form" :rules="computedRules" size="small" label-width="100px">

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
              <el-form-item v-if="field.required" :label="field.label" :prop="'dataDetails.' + field.prop">
                <!-- 输入框 -->
                <el-input
                  v-if="field.type === 'input' || !field.type"
                  v-model="form.dataDetails[field.prop]"
                  :placeholder="field.placeholder"
                  style="width: 100%;"
                />
                <!-- 下拉选择框 -->
                <el-select
                  v-else-if="field.type === 'select'"
                  v-model="form.dataDetails[field.prop]"
                  :placeholder="field.placeholder"
                  style="width: 100%;"
                >
                  <el-option
                    v-for="option in field.options"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
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
      <el-button :loading="saveLoading" type="info" @click="handleSaveDraft">保存</el-button>
      <el-button :loading="submitLoading" type="primary" @click="handleSubmit">提交申请</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { getAll } from '@/api/system/role'
import { getUsersByRoleId } from '@/api/system/user'
import { submitApplication, saveDraft } from '@/api/applicationForm'
import { getDataRulesByType } from '@/utils/dataFields'

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
  name: 'ApplicationFormDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    formData: {
      type: Object,
      default: () => ({})
    },
    mode: {
      type: String,
      default: 'add' // 'add' 或 'edit'
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
    }
  },
  data() {
    return {
      saveLoading: false,
      submitLoading: false,
      form: { ...defaultForm },

      baseRules: {
        applicationTitle: [
          { required: true, message: '申请单标题不能为空', trigger: 'blur' }
        ],
        applicationReason: [
          { required: true, message: '申请理由不能为空', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    },
    title() {
      return this.mode === 'edit' ? '编辑申请单' : '新增申请单'
    },
    computedRules() {
      const rules = { ...this.baseRules }

      // 如果显示审核信息区域，则添加审核相关的校验规则
      if (this.showApprovalSection) {
        rules.devContact = [
          { required: true, message: '请选择研发接口人', trigger: 'change' }
        ]
        rules.testContact = [
          { required: true, message: '请选择设备接口人', trigger: 'change' }
        ]
        rules.devLeader = [
          { required: true, message: '请选择研发组长', trigger: 'change' }
        ]
        rules.testLeader = [
          { required: true, message: '请选择设备组长', trigger: 'change' }
        ]
      }

      // 根据设备数据类型获取设备字段的校验规则
      const dataRules = getDataRulesByType(this.applicationDataType)
      Object.assign(rules, dataRules)

      return rules
    }
  },
  watch: {
    formData: {
      handler(newVal) {
        if (newVal && Object.keys(newVal).length > 0) {
          // 使用深拷贝确保不会影响原始数据
          const newData = JSON.parse(JSON.stringify(newVal))
          // 确保 dataDetails 对象存在
          if (!newData.dataDetails) {
            newData.dataDetails = { ...defaultForm.dataDetails }
          } else {
            // 合并默认值和传入值，确保所有字段都存在
            newData.dataDetails = { ...defaultForm.dataDetails, ...newData.dataDetails }
          }
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
  methods: {
    handleClose() {
      this.$emit('close')
      this.resetForm()
    },

    resetForm() {
      this.form = JSON.parse(JSON.stringify(defaultForm))
      if (this.$refs.form) {
        this.$nextTick(() => {
          this.$refs.form.resetFields()
        })
      }
    },

    async handleSubmit() {
      try {
        // 验证表单
        await this.$refs.form.validate()

        this.submitLoading = true

        // 构造提交数据
        const submitData = this.buildSubmitData()

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

    // 构建提交数据，适配不同的使用场景
    buildSubmitData() {
      // 检查是否需要将嵌套结构转换为扁平结构
      // 这通常用于 devices/one/index.vue 这样的场景
      const isFlatStructureNeeded = this.$parent && this.$parent.$options.name === 'DeviceInfo'

      if (isFlatStructureNeeded) {
        // 转换为扁平结构
        const flatData = {
          ...this.form,
          dataDetails: JSON.stringify(this.form.dataDetails),
          applicationType: this.getApplicationType()
        }

        // 将 dataDetails 中的字段提取到顶层
        Object.keys(this.form.dataDetails).forEach(key => {
          flatData[key] = this.form.dataDetails[key]
        })

        return flatData
      } else {
        // 保持嵌套结构
        return {
          ...this.form,
          dataDetails: JSON.stringify(this.form.dataDetails),
          applicationType: this.getApplicationType()
        }
      }
    },

    getApplicationType() {
      // 根据操作状态确定申请类型
      if (this.mode === 'add') {
        return 1 // 新增
      } else if (this.mode === 'edit') {
        return 2 // 编辑
      }
      return 1 // 默认新增
    },

    // 新增保存草稿方法
    async handleSaveDraft() {
      this.saveLoading = true
      try {
        // 验证表单
        await this.$refs.form.validate()

        // 构造提交数据
        const submitData = this.buildSubmitData()

        // 调用保存草稿接口
        await saveDraft(submitData)
        this.$message.success('草稿保存成功')
        this.$emit('save-success')
        this.handleClose()
      } catch (error) {
        console.error('保存草稿失败', error)
        this.$message.error('保存草稿失败')
      } finally {
        this.saveLoading = false
      }
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
    }
  }
}
</script>

<style scoped>
/* 可以根据需要添加样式 */
</style>

