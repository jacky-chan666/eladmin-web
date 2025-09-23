<template>
  <el-dialog
    :visible.sync="dialogVisible"
    :title="title"
    width="800px"
    top="5vh"
    :close-on-click-modal="false"
  >
    <el-tabs type="border-card">
      <!-- Tab 1: 申请信息 -->
      <el-tab-pane label="单据信息">
        <el-descriptions :column="1" border size="medium">
          <el-descriptions-item label="申请单ID">{{ detail.uuid }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ detail.applicantUserName }}</el-descriptions-item>
          <el-descriptions-item label="表单标题">{{ detail.applicationTitle }}</el-descriptions-item>
          <el-descriptions-item label="申请日期">{{ detail.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="申请类型">{{ getApplicationTypeName(detail.applicationType) }}</el-descriptions-item>
          <el-descriptions-item label="数据类型">{{ getApplicationDataTypeName(detail.applicationDataType) }}</el-descriptions-item>
          <el-descriptions-item label="申请状态">{{ getStatusName(detail.status) }}</el-descriptions-item>
          <el-descriptions-item label="申请理由">
            <div style="white-space: pre-wrap;">{{ detail.applicationReason || '暂无' }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <!-- Tab 2: 设备信息 -->
      <el-tab-pane label="设备信息">
        <div v-if="loadingDataDetails">正在加载设备信息...</div>
        <el-descriptions v-else :column="1" border size="medium">
          <el-descriptions-item
            v-for="(field, index) in dataFields"
            :key="index"
            :label="field.label"
          >
            <div v-if="field.prop === 'adoptResp'" style="white-space: pre-wrap;">
              {{ getDataFieldValue(field.prop) || '暂无' }}
            </div>
            <div v-else>
              {{ getDataFieldValue(field.prop) || '暂无' }}
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <!-- Tab 3: 审核信息 -->
      <el-tab-pane label="审核信息">
        <el-descriptions :column="1" border size="medium">
          <!-- 动态生成审批人信息 -->
          <el-descriptions-item
            v-for="approver in approverConfig"
            :key="approver.key"
            :label="approver.label"
          >
            <div>
              <div><strong>审核人：</strong>{{ detail[approver.prop] || '暂无' }}</div>
              <div><strong>审核状态：</strong><el-tag :type="approvalTag(detail[getApprovalStatusProp(approver.key)])">{{ getApprovalStatusName(detail[getApprovalStatusProp(approver.key)]) || '未审核' }}</el-tag></div>
              <div><strong>审核意见：</strong>{{ detail[getApprovalCommentProp(approver.key)] || '无' }}</div>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <!-- Tab 4: 历史记录 -->
      <el-tab-pane label="历史记录">
        <div v-if="approvalHistory.length === 0" style="text-align: center; padding: 20px;">
          暂无审批历史记录
        </div>
        <div v-else>
          <div v-for="(round, index) in groupedApprovalHistory" :key="index">
            <h3>第 {{ round.round }} 轮审批</h3>
            <el-timeline>
              <el-timeline-item
                v-for="(record, idx) in round.records"
                :key="idx"
                :timestamp="formatTimestamp(record.approvedAt)"
                placement="top"
              >
                <el-card>
                  <div><strong>审批角色：</strong>{{ getApproverRoleName(record.approverRole) }}</div>
                  <div><strong>审批人：</strong>{{ record.approverUserName }}</div>
                  <div><strong>审批状态：</strong><el-tag :type="approvalTag(record.approvalStatus)">{{getApprovalStatusName(record.approvalStatus)}}</el-tag></div>
                  <div><strong>审批意见：</strong>{{ record.comment || '无' }}</div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            <el-divider v-if="index < groupedApprovalHistory.length - 1"></el-divider>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 底部按钮 -->
    <div slot="footer" class="dialog-footer">
      <slot name="actions">
        <el-button size="small" @click="handleClose">关闭</el-button>
      </slot>
    </div>
  </el-dialog>
</template>

<script>
import {
  getDataFieldsByType,
  APPROVER_CONFIG,
  APPROVER_STATUS_PROPS,
  APPROVER_COMMENT_PROPS,
  getApprovalStatusName,
  getApplicationStatusName,
  getApplicationTypeName,
  getApplicationDataTypeName,
  getModelTypeName,
  getDeviceTypeName,
  APPROVAL_STATUS
} from '@/utils/dataFields'

export default {
  name: 'ApplicationDetailView',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    detailData: {
      type: Object,
      default: () => ({})
    },
    title: {
      type: String,
      default: '申请单详情'
    }
  },
  data() {
    return {
      detail: {},
      parsedData: {},
      approvalHistory: [],
      groupedApprovalHistory: [],
      loadingDataDetails: false,
      // 审批人配置
      approverConfig: APPROVER_CONFIG
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
    dataFields() {
      if (this.detail.applicationDataType) {
        return getDataFieldsByType(this.detail.applicationDataType)
      }
      return []
    }
  },
  watch: {
    detailData: {
      handler(newVal) {
        if (newVal && Object.keys(newVal).length > 0) {
          this.detail = { ...newVal }
          this.parseData()
          this.parseApprovalHistory()
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    // 获取审批状态属性名
    getApprovalStatusProp(approverKey) {
      return APPROVER_STATUS_PROPS[approverKey] || `${approverKey}Approval`
    },

    // 获取审批意见属性名
    getApprovalCommentProp(approverKey) {
      return APPROVER_COMMENT_PROPS[approverKey] || `${approverKey}Comment`
    },

    // 获取设备字段值
    getDataFieldValue(prop) {
      // 处理嵌套属性，如 dataDetails.model
      if (prop.startsWith('dataDetails.')) {
        const key = prop.split('.')[1]
        return this.parsedData[key]
      }
      return this.parsedData[prop]
    },

    // 获取申请单类型名称
    getApplicationTypeName(type) {
      return getApplicationTypeName(type)
    },

    // 获取申请单数据类型名称
    getApplicationDataTypeName(type) {
      return getApplicationDataTypeName(type)
    },

    // 获取设备类型名称
    getModelTypeName(type) {
      return getModelTypeName(type)
    },

    // 获取设备种类名称
    getDeviceTypeName(type) {
      return getDeviceTypeName(type)
    },

    // 获取申请状态名称
    getStatusName(status) {
      // 确保状态值为数字类型
      const statusValue = parseInt(status, 10)
      return getApplicationStatusName(statusValue)
    },

    // 获取审批状态名称
    getApprovalStatusName(status) {
      return getApprovalStatusName(status)
    },

    // 获取审批人角色名称
    getApproverRoleName(role) {
      // 根据配置获取角色名称
      const approver = this.approverConfig.find(item => item.key === role);
      if (approver) {
        return approver.label;
      }
      return role || '未知'
    },

    // 审批状态标签类型
    approvalTag(status) {
      const statusValue = parseInt(status, 10)
      switch (statusValue) {
        case APPROVAL_STATUS.APPROVED:
          return 'success'
        case APPROVAL_STATUS.REJECTED:
          return 'danger'
        case APPROVAL_STATUS.PENDING:
        default:
          return 'info'
      }
    },

    // 格式化时间戳
    formatTimestamp(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
    },

    // 解析设备信息
    parseData() {
      this.loadingDataDetails = true
      if (this.detail.dataDetails) {
        try {
          this.parsedData = JSON.parse(this.detail.dataDetails)
        } catch (e) {
          console.error('解析设备信息失败:', e)
          this.parsedData = {}
        }
      } else {
        this.parsedData = {}
      }
      this.loadingDataDetails = false
    },

    // 解析审批历史记录
    parseApprovalHistory() {
      if (this.detail.approvalHistory) {
        try {
          this.approvalHistory = JSON.parse(this.detail.approvalHistory)
          // 按轮次分组
          this.groupedApprovalHistory = this.groupApprovalHistory(this.approvalHistory)
        } catch (e) {
          console.error('解析审批历史失败:', e)
          this.approvalHistory = []
          this.groupedApprovalHistory = []
        }
      } else {
        this.approvalHistory = []
        this.groupedApprovalHistory = []
      }
    },

    // 按轮次分组审批历史记录
    groupApprovalHistory(history) {
      if (!history || !Array.isArray(history)) return []

      // 按轮次分组
      const grouped = {}
      history.forEach(record => {
        const round = record.round
        if (!grouped[round]) {
          grouped[round] = []
        }
        grouped[round].push(record)
      })

      // 转换为数组并按轮次排序
      return Object.keys(grouped)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(round => ({
          round: parseInt(round),
          records: grouped[round]
        }))
    },

    handleClose() {
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
/* 可以根据需要添加样式 */
</style>
