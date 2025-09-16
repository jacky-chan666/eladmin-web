<template>
  <div>
    <!-- 上线按钮 -->
    <el-button
      v-permission="permission.online"
      :disabled="disabledOnline"
      size="mini"
      type="success"
      icon="el-icon-upload2"
      @click.stop="showOnlineForm">
      上线
    </el-button>

    <!-- 下线按钮 -->
    <el-button
      v-permission="permission.offline"
      :disabled="disabledOffline"
      size="mini"
      type="warning"
      icon="el-icon-download"
      @click.stop="showOfflineForm">
      下线
    </el-button>

    <!-- 上线理由表单弹窗 -->
    <el-dialog
      :visible.sync="onlineFormVisible"
      title="上线确认"
      width="400px"
      center>
      <el-form :model="onlineForm" ref="onlineFormRef">
        <el-form-item
          label="上线理由"
          prop="reason"
          :rules="{ required: true, message: '请输入上线理由', trigger: 'blur' }">
          <el-input
            type="textarea"
            v-model="onlineForm.reason"
            placeholder="请输入上线理由" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="cancelOnline">取消</el-button>
        <el-button type="primary" @click="submitOnline">确认</el-button>
      </div>
    </el-dialog>

    <!-- 下线理由表单弹窗 -->
    <el-dialog
      :visible.sync="offlineFormVisible"
      title="下线确认"
      width="400px"
      center>
      <el-form :model="offlineForm" ref="offlineFormRef">
        <el-form-item
          label="下线理由"
          prop="reason"
          :rules="{ required: true, message: '请输入下线理由', trigger: 'blur' }">
          <el-input
            type="textarea"
            v-model="offlineForm.reason"
            placeholder="请输入下线理由" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="cancelOffline">取消</el-button>
        <el-button type="primary" @click="submitOffline">确认</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import CRUD, { crud } from '@crud/crud'

export default {
  mixins: [crud()],
  props: {
    data: {
      type: Object,
      required: true
    },
    permission: {
      type: Object,
      required: true
    },
    disabledOnline: {
      type: Boolean,
      default: false
    },
    disabledOffline: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      onlineFormVisible: false,
      offlineFormVisible: false,
      onlineForm: {
        reason: ''
      },
      offlineForm: {
        reason: ''
      }
    }
  },
  methods: {
    showOnlineForm() {
      this.onlineForm.reason = ''
      this.onlineFormVisible = true
    },

    showOfflineForm() {
      this.offlineForm.reason = ''
      this.offlineFormVisible = true
    },

    cancelOnline() {
      this.onlineFormVisible = false
      // 移除了可选链操作符，改为传统判断方式
      if (this.$refs.onlineFormRef) {
        this.$refs.onlineFormRef.resetFields()
      }
    },

    cancelOffline() {
      this.offlineFormVisible = false
      // 移除了可选链操作符，改为传统判断方式
      if (this.$refs.offlineFormRef) {
        this.$refs.offlineFormRef.resetFields()
      }
    },

    submitOnline() {
      // 使用传统的存在性检查替代可选链操作符
      if (this.$refs.onlineFormRef) {
        this.$refs.onlineFormRef.validate((valid) => {
          if (valid) {
            // 处理上线逻辑，可以调用相应的 CRUD 方法
            this.crud.notify('上线操作已提交，理由: ' + this.onlineForm.reason, CRUD.NOTIFICATION_TYPE.SUCCESS)
            this.onlineFormVisible = false
          }
        })
      }
    },

    submitOffline() {
      // 使用传统的存在性检查替代可选链操作符
      if (this.$refs.offlineFormRef) {
        this.$refs.offlineFormRef.validate((valid) => {
          if (valid) {
            // 处理下线逻辑，可以调用相应的 CRUD 方法
            this.crud.notify('下线操作已提交，理由: ' + this.offlineForm.reason, CRUD.NOTIFICATION_TYPE.SUCCESS)
            this.offlineFormVisible = false
          }
        })
      }
    }
  }
}
</script>

<style scoped>
/* 可以根据需要添加样式 */
</style>
