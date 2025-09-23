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
    <el-form ref="form" :model="form" :rules="rules" size="small" label-width="100px">

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
          <!-- 动态生成审核人字段 -->
          <el-col
            v-for="(approver, index) in approverConfig"
            :key="approver.prop"
            :span="12"
          >
            <el-form-item :label="approver.label" :prop="approver.key">
              <el-select
                v-model="form[approver.key]"
                filterable
                placeholder="请选择"
                size="small"
                style="width: 100%;"
              >
                <el-option
                  v-for="user in getUserListByKey(approver.key)"
                  :key="user.id"
                  :label="user.username"
                  :value="user.username"
                />
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
import { getDataRulesByType, APPROVER_CONFIG, APPLICATION_TYPE} from '@/utils/dataFields'



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
    applicationType: {
      type: Number,
      default: APPLICATION_TYPE.ADD // 'add' 或 'edit'
    },
    showApprovalSection: {
      type: Boolean,
      default: true
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
    // 初始化基础规则
    const baseRules = {
      applicationTitle: [{ required: true, message: '申请单标题不能为空', trigger: 'blur' }],
      applicationReason: [{ required: true, message: '申请理由不能为空', trigger: 'blur' }],
      reason: [{ required: true, message: '请输入理由', trigger: 'blur' }]
    }
    const dataRules = getDataRulesByType(this.applicationDataType)

    // 初始化规则对象
    const rules = { ...baseRules, ...dataRules }

    // 根据配置动态生成审核相关的校验规则
    APPROVER_CONFIG.forEach(approver => {
      rules[approver.key] = [
        { required: true, message: `请选择${approver.label}`, trigger: 'change' }
      ]
    })

    return {
      saveLoading: false,
      submitLoading: false,
      form: { },
      // 审批人配置
      approverConfig: APPROVER_CONFIG,
      rules
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
      return this.applicationType === APPLICATION_TYPE.EDIT ? '编辑申请单' : '新增申请单'
    }
  },
  watch: {
    formData: {
      handler(newVal) {
        if (newVal && Object.keys(newVal).length > 0) {
          // 使用深拷贝确保不会影响原始数据
          const newData = JSON.parse(JSON.stringify(newVal))
          this.form = { ...newData }
          this.loadApproverUsersByRoles()
        } else if (!newVal || Object.keys(newVal).length === 0) {
          // 如果没有传入数据，则重置为默认表单
          this.resetForm()
        }
      },
      immediate: true,
      deep: true
    },
  },
  methods: {
    // 根据审批人key获取对应的用户列表
    getUserListByKey(key) {
      // 使用配置中的usersProp字段来获取对应的用户列表属性名
      const approver = this.approverConfig.find(item => item.key === key);
      if (approver && approver.usersProp) {
        return this[approver.usersProp] || []
      }
      return []
    },

    handleClose() {
      this.$emit('close')
      this.resetForm()
    },

    resetForm() {
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
        const submitData = {
          ...this.form,
          dataDetails: JSON.stringify(this.form.dataDetails)
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
    // 新增保存草稿方法
    async handleSaveDraft() {
      this.saveLoading = true
      try {
        // 验证表单
        await this.$refs.form.validate()

        // 构造提交数据
        const submitData = {
          ...this.form,
          dataDetails: JSON.stringify(this.form.dataDetails)
        }

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

        // 存储获取到的用户列表
        const userLists = {}

        // 根据配置获取对应的用户
        for (const approver of this.approverConfig) {
          const role = roles.find(r => r.name.includes(approver.roleKeyword))
          if (role) {
            const users = await getUsersByRoleId(role.id)
            // 使用配置中的usersProp字段作为键名
            userLists[approver.usersProp] = users.content || users
          }
        }

        // 更新本地数据
        Object.keys(userLists).forEach(key => {
          this[key] = userLists[key];
        });

        // 触发事件，通知父组件更新审批人列表
        this.$emit('update-approver-users', userLists)
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
