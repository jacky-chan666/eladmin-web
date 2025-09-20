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
      width="700px"
      center
      @close="handleClose"
    >
      <el-form :model="formData" ref="formRef" :rules="rules" label-width="100px">

        <!-- 理由输入 -->
        <el-card shadow="never" style="margin-bottom: 20px;">
          <div slot="header" style="font-weight: bold; font-size: 16px;">{{ reasonLabel }}</div>
          <el-form-item prop="reason">
            <el-input
              type="textarea"
              :rows="3"
              v-model="formData.reason"
              :placeholder="reasonPlaceholder"
            />
          </el-form-item>
        </el-card>

        <!-- 审核信息 -->
        <el-card shadow="never" style="margin-bottom: 20px;">
          <div slot="header" style="font-weight: bold; font-size: 16px;">审核信息</div>
          <el-row :gutter="20">
            <!-- 申请人 -->
            <el-col :span="24">
              <el-form-item label="申请人" prop="applicant">
                <el-input v-model="formData.applicant" disabled style="width: 100%;" />
              </el-form-item>
            </el-col>

            <!-- 审批人 -->
            <el-col :span="24">
              <el-form-item label="研发接口人" prop="devInterface">
                <el-select v-model="formData.devInterface" filterable placeholder="请选择研发接口人" style="width: 100%;">
                  <el-option
                    v-for="user in devInterfaceUsers"
                    :key="user.id"
                    :label="user.name"
                    :value="user.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="设备接口人" prop="deviceInterface">
                <el-select v-model="formData.deviceInterface" filterable placeholder="请选择设备接口人" style="width: 100%;">
                  <el-option
                    v-for="user in deviceInterfaceUsers"
                    :key="user.id"
                    :label="user.name"
                    :value="user.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="研发组长" prop="devLeader">
                <el-select v-model="formData.devLeader" filterable placeholder="请选择研发组长" style="width: 100%;">
                  <el-option
                    v-for="user in devLeaderUsers"
                    :key="user.id"
                    :label="user.name"
                    :value="user.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="测试组长" prop="testLeader">
                <el-select v-model="formData.testLeader" filterable placeholder="请选择测试组长" style="width: 100%;">
                  <el-option
                    v-for="user in testLeaderUsers"
                    :key="user.id"
                    :label="user.name"
                    :value="user.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

      </el-form>

      <div slot="footer">
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" @click="submit">确认</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import CRUD, { crud } from '@crud/crud'

export default {
  mixins: [crud()],
  props: {
    data: { type: Object, required: true },
    permission: { type: Object, required: true },
    disabledOnline: { type: Boolean, default: false },
    disabledOffline: { type: Boolean, default: false }
  },
  data() {
    return {
      formVisible: false,
      operationType: '', // 'online' 或 'offline'

      formData: {
        reason: '',
        applicant: '',
        devInterface: null,
        deviceInterface: null,
        devLeader: null,
        testLeader: null
      },

      // 审批人列表（从父级或全局获取）
      devContactUsers: [],
      testContactUsers: [],
      devLeaderUsers: [],
      testLeaderUsers: [],

      rules: {
        reason: [{ required: true, message: '请输入理由', trigger: 'blur' }],
        applicant: [{ required: true, message: '申请人不能为空', trigger: 'blur' }],
        devInterface: [{ required: true, message: '请选择研发接口人', trigger: 'change' }],
        deviceInterface: [{ required: true, message: '请选择设备接口人', trigger: 'change' }],
        devLeader: [{ required: true, message: '请选择研发组长', trigger: 'change' }],
        testLeader: [{ required: true, message: '请选择测试组长', trigger: 'change' }]
      }
    }
  },
  computed: {
    isOnlineDisabled() {
      return !this.data || this.data.modelVersion <= 2
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

      // 初始化表单 + 填充申请人
      this.formData.reason = ''
      this.formData.applicant = this.$store.getters.name || '系统用户'
      this.formData.devInterface = null
      this.formData.deviceInterface = null
      this.formData.devLeader = null
      this.formData.testLeader = null

      // 加载审批人列表（仅加载一次）
      if (this.devContactUsers.length === 0) {
        this.loadApproverUsers()
      }

      // 清空校验状态
      this.$nextTick(() => {
        if (this.$refs.formRef) {
          this.$refs.formRef.clearValidate()
        }
      })
    },

    loadApproverUsers() {
      const mockUsers = [
        { id: 1, name: '张工', roles: ['dev_interface'] },
        { id: 2, name: '李工', roles: ['device_interface'] },
        { id: 3, name: '王组长', roles: ['dev_leader'] },
        { id: 4, name: '赵组长', roles: ['test_leader'] },
        { id: 5, name: '刘工', roles: ['dev_interface', 'dev_leader'] },
        { id: 6, name: '陈组长', roles: ['test_leader'] }
      ]

      this.devInterfaceUsers = mockUsers.filter(u => u.roles.includes('dev_interface'))
      this.deviceInterfaceUsers = mockUsers.filter(u => u.roles.includes('device_interface'))
      this.devLeaderUsers = mockUsers.filter(u => u.roles.includes('dev_leader'))
      this.testLeaderUsers = mockUsers.filter(u => u.roles.includes('test_leader'))
    },

    handleClose() {
      if (this.$refs.formRef) {
        this.$refs.formRef.resetFields()
      }
    },

    cancel() {
      this.formVisible = false
    },

    submit() {
      this.$refs.formRef.validate(valid => {
        if (valid) {
          const payload = {
            ...this.formData,
            operation: this.operationType,
            targetId: this.data.id
          }

          // 这里可以调用 API 提交
          this.crud.notify(
            `${this.dialogTitle}成功，理由：${this.formData.reason}`,
            CRUD.NOTIFICATION_TYPE.SUCCESS
          )

          this.formVisible = false
        }
      })
    }
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

