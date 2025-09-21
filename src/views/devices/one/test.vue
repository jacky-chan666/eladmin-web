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
          <!-- 审定单编号 -->
          <el-col :span="12">
            <el-form-item label="审定单编号">
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

          <!-- 设备型号 + 设备版本 -->
          <el-col :span="12">
            <el-form-item label="设备型号" prop="dataDetails.model">
              <el-input v-model="form.dataDetails.model" placeholder="如：ER7206, SG2008" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备版本" prop="dataDetails.modelVersion">
              <el-input v-model="form.dataDetails.modelVersion" placeholder="如：1.0" style="width: 100%;" />
            </el-form-item>
          </el-col>

          <!-- 设备类型 (model_type) -->
          <el-col :span="12">
            <el-form-item label="设备类型" prop="dataDetails.modelType">
              <el-select v-model="form.dataDetails.modelType" placeholder="请选择设备类型" style="width: 100%;">
                <el-option label="普通设备 (NORMAL)" value="NORMAL" />
                <el-option label="Pro设备 (PRO)" value="PRO" />
                <el-option label="一体机 (COMBINED)" value="COMBINED" />
                <el-option label="PRO管理普通设备 (PRO_FREE)" value="PRO_FREE" />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 设备种类 (type) -->
          <el-col :span="12">
            <el-form-item label="设备种类" prop="dataDetails.type">
              <el-select v-model="form.dataDetails.type" placeholder="请选择设备种类" style="width: 100%;">
                <el-option label="网关 (gateway)" value="gateway" />
                <el-option label="交换机 (switch)" value="switch" />
                <el-option label="AP (ap)" value="ap" />
                <el-option label="OLT (olt)" value="olt" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 硬件版本 (hw_version) - 可选 -->
          <el-col :span="12">
            <el-form-item label="硬件版本" prop="dataDetails.hwVersion">
              <el-input
                v-model="form.dataDetails.hwVersion"
                placeholder="如：v1.2.3（可选）"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>

          <!-- 模版版本 (controller_version) -->
          <el-col :span="12">
            <el-form-item label="模版版本" prop="dataDetails.controllerVersion">
              <el-input
                v-model="form.dataDetails.controllerVersion"
                placeholder="如：5.15.21.1"
                style="width: 100%;"
                clearable
              />
            </el-form-item>
          </el-col>

          <!-- 设备版本 (version) -->
          <el-col :span="12">
            <el-form-item label="设备版本号" prop="dataDetails.version">
              <el-input
                v-model="form.dataDetails.version"
                placeholder="如：1.0"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>

          <!-- 收养报文 (adopt_resp) -->
          <el-col :span="24">
            <el-form-item label="收养报文" prop="dataDetails.adoptResp" class="adopt-resp-item">
              <el-input
                v-model="form.dataDetails.adoptResp"
                type="textarea"
                :rows="4"
                placeholder='请填写转义后的JSON字符串，例如：{"modelId": "123"}'
                style="width: 100%;"
              />
              <small style="color: #999; margin-top: 5px; display: block;">
                收养阶段组件协商报文 body 内容，参考：
                <a
                  href="https://pdconfluence.tp-link.com/display/SMBSHAR/Device+Negonation-OSG"
                  target="_blank"
                  style="color: #409EFF;"
                >
                  Device Negotiation-OSG
                </a>
              </small>
            </el-form-item>
          </el-col>
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

// 更新默认表单值
const defaultForm = {
  id: null,
  uuid: null,
  applicationTitle: null,
  applicationReason: null,
  applicationType: null, // 1:新增, 2:编辑, 3:上线, 4:下线
  applicationDataType: 1, // 默认为1
  applicantUserName: '',
  devContact: null,
  testContact: null,
  devLeader: null,
  testLeader: null,
  dataDetails: {
    model: null,
    modelVersion: null,
    modelType: null, // NORMAL / PRO / COMBINED / PRO_FREE
    type: null, // gateway / switch / ap / olt
    hwVersion: null, // v1.2.3（可选）
    controllerVersion: null, // 5.15.21.1
    version: null, // 1.0（设备版本）
    adoptResp: '{"modelId": "123"}' // 默认示例值
  }
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
    }
  },
  data() {
    return {
      saveLoading: false,
      submitLoading: false,
      form: { ...defaultForm },

      baseRules: {
        'dataDetails.model': [
          { required: true, message: '设备型号不能为空', trigger: 'blur' }
        ],
        'dataDetails.modelVersion': [
          { required: true, message: '设备版本不能为空', trigger: 'blur' }
        ],
        'dataDetails.modelType': [
          { required: true, message: '请选择设备类型', trigger: 'change' }
        ],
        'dataDetails.type': [
          { required: true, message: '请选择设备种类', trigger: 'change' }
        ],
        'dataDetails.controllerVersion': [
          { required: true, message: '模版版本不能为空', trigger: 'blur' }
        ],
        'dataDetails.version': [
          { required: true, message: '设备版本不能为空', trigger: 'blur' }
        ],
        'dataDetails.adoptResp': [
          { required: true, message: '收养报文不能为空', trigger: 'blur' },
          { validator: this.validateAdoptResp, trigger: 'blur' }
        ],
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

      return rules
    }
  },
  watch: {
    formData: {
      handler(newVal) {
        if (newVal && Object.keys(newVal).length > 0) {
          this.form = { ...defaultForm, ...newVal }
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
    }
  },
  methods: {
    validateAdoptResp(rule, value, callback) {
      if (!value) {
        return callback(new Error('收养报文不能为空'))
      }
      try {
        JSON.parse(value)
        callback()
      } catch (e) {
        callback(new Error('收养报文必须是合法的转义JSON字符串'))
      }
    },

    handleClose() {
      this.$emit('close')
      this.resetForm()
    },

    resetForm() {
      this.form = { ...defaultForm }
      this.$refs.form && this.$refs.form.resetFields()
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
        const submitData = {
          ...this.form,
          id: null,
          dataDetails: JSON.stringify(this.form.dataDetails),
          applicationType: this.getApplicationType()
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
