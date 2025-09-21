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
        <div v-if="loadingDeviceInfo">正在加载设备信息...</div>
        <el-descriptions v-else :column="1" border size="medium">
          <el-descriptions-item
            v-for="(field, index) in deviceFields"
            :key="index"
            :label="field.label"
          >
            <div v-if="field.prop === 'adoptResp'" style="white-space: pre-wrap;">
              {{ getDeviceFieldValue(field.prop) || '暂无' }}
            </div>
            <div v-else>
              {{ getDeviceFieldValue(field.prop) || '暂无' }}
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <!-- Tab 3: 审核信息 -->
      <el-tab-pane label="审核信息">
        <el-descriptions :column="1" border size="medium">
          <!-- 测试接口人 -->
          <el-descriptions-item label="测试接口人">
            <div>
              <div><strong>审核人：</strong>{{ detail.testContact || '暂无' }}</div>
              <div><strong>审核状态：</strong><el-tag :type="approvalTag(detail.testContactApproval)">{{ getApprovalStatusName(detail.testContactApproval) || '未审核' }}</el-tag></div>
              <div><strong>审核意见：</strong>{{ detail.testContactComment || '无' }}</div>
            </div>
          </el-descriptions-item>

          <!-- 研发接口人 -->
          <el-descriptions-item label="研发接口人">
            <div>
              <div><strong>审核人：</strong>{{ detail.devContact || '暂无' }}</div>
              <div><strong>审核状态：</strong><el-tag :type="approvalTag(detail.devContactApproval)">{{ getApprovalStatusName(detail.devContactApproval) || '未审核' }}</el-tag></div>
              <div><strong>审核意见：</strong>{{ detail.devContactComment || '无' }}</div>
            </div>
          </el-descriptions-item>

          <!-- 测试组长 -->
          <el-descriptions-item label="测试组长">
            <div>
              <div><strong>审核人：</strong>{{ detail.testLeader || '暂无' }}</div>
              <div><strong>审核状态：</strong><el-tag :type="approvalTag(detail.testLeaderApproval)">{{ getApprovalStatusName(detail.testLeaderApproval) || '未审核' }}</el-tag></div>
              <div><strong>审核意见：</strong>{{ detail.testLeaderComment || '无' }}</div>
            </div>
          </el-descriptions-item>

          <!-- 研发组长 -->
          <el-descriptions-item label="研发组长">
            <div>
              <div><strong>审核人：</strong>{{ detail.devLeader || '暂无' }}</div>
              <div><strong>审核状态：</strong><el-tag :type="approvalTag(detail.devLeaderApproval)">{{ getApprovalStatusName(detail.devLeaderApproval) || '未审核' }}</el-tag></div>
              <div><strong>审核意见：</strong>{{ detail.devLeaderComment || '无' }}</div>
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
import { getDataFieldsByType } from '@/utils/dataFields'

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
      parsedDeviceInfo: {},
      approvalHistory: [],
      groupedApprovalHistory: [],
      loadingDeviceInfo: false,

      // 申请单状态常量定义
      STATUS_DRAFT: -1, // 草稿
      STATUS_SUBMITTED: 0, // 已提交
      STATUS_PENDING: 1, // 待审批
      STATUS_APPROVED: 2, // 审批通过
      STATUS_FIRMWARE_VERIFY: 3, // 固件校验中
      STATUS_FIRMWARE_FAILED: 4, // 固件校验失败
      STATUS_SYNCING: 5, // 同步中
      STATUS_SYNC_FAILED: 6, // 同步失败
      STATUS_COMPLETED: 7, // 已完成
      STATUS_REJECTED: 8, // 已驳回
      STATUS_AUTO_PROCESSING: 9, // 自动处理中
      STATUS_AUTO_FAILED: 10, // 自动处理失败
      STATUS_MANUAL_TRIGGERED: 11, // 手动触发
      STATUS_WITHDRAWN: 12, // 已撤回

      APPROVAL_STATUS_PENDING: 0,
      APPROVAL_STATUS_APPROVED: 1,
      APPROVAL_STATUS_REJECTED: 2
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
    deviceFields() {
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
          this.parseDeviceInfo()
          this.parseApprovalHistory()
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    // 获取设备字段值
    getDeviceFieldValue(prop) {
      // 处理嵌套属性，如 dataDetails.model
      if (prop.startsWith('dataDetails.')) {
        const key = prop.split('.')[1]
        return this.parsedDeviceInfo[key]
      }
      return this.parsedDeviceInfo[prop]
    },

    // 获取申请单类型名称
    getApplicationTypeName(type) {
      const typeMap = {
        1: '新增',
        2: '编辑',
        3: '上线',
        4: '下线'
      }
      return typeMap[type] || '未知'
    },

    // 获取申请单数据类型名称
    getApplicationDataTypeName(type) {
      const typeMap = {
        1: '第一种设备类型',
        2: '第二种设备类型'
      }
      return typeMap[type] || '未知'
    },

    // 获取设备类型名称
    getModelTypeName(type) {
      const typeMap = {
        'NORMAL': '普通设备',
        'PRO': 'Pro设备',
        'COMBINED': '一体机',
        'PRO_FREE': 'PRO管理普通设备'
      }
      return typeMap[type] || type || '未知'
    },

    // 获取设备种类名称
    getTypeName(type) {
      const typeMap = {
        'gateway': '网关',
        'switch': '交换机',
        'ap': 'AP',
        'olt': 'OLT',
        'other': '其他'
      }
      return typeMap[type] || type || '未知'
    },

    // 获取申请状态名称
    getStatusName(status) {
      // 确保状态值为数字类型
      const statusValue = parseInt(status, 10)

      const statusMap = {
        [this.STATUS_DRAFT]: '草稿',
        [this.STATUS_SUBMITTED]: '已提交',
        [this.STATUS_PENDING]: '待审批',
        [this.STATUS_APPROVED]: '审批通过',
        [this.STATUS_FIRMWARE_VERIFY]: '固件校验中',
        [this.STATUS_FIRMWARE_FAILED]: '固件校验失败',
        [this.STATUS_SYNCING]: '同步中',
        [this.STATUS_SYNC_FAILED]: '同步失败',
        [this.STATUS_COMPLETED]: '已完成',
        [this.STATUS_REJECTED]: '已驳回',
        [this.STATUS_AUTO_PROCESSING]: '自动处理中',
        [this.STATUS_AUTO_FAILED]: '自动处理失败',
        [this.STATUS_MANUAL_TRIGGERED]: '手动触发',
        [this.STATUS_WITHDRAWN]: '已撤回'
      }

      return statusMap[statusValue] || '未知状态'
    },

    // 获取审批状态名称
    getApprovalStatusName(status) {
      const statusMap = {
        [this.APPROVAL_STATUS_PENDING]: '待审批',
        [this.APPROVAL_STATUS_APPROVED]: '通过',
        [this.APPROVAL_STATUS_REJECTED]: '驳回'
      }
      return statusMap[status] || '未知'
    },

    // 获取审批人角色名称
    getApproverRoleName(role) {
      const roleMap = {
        'devContact': '研发接口人',
        'testContact': '测试接口人',
        'devLeader': '研发组长',
        'testLeader': '测试组长'
      }
      return roleMap[role] || role || '未知'
    },

    // 审批状态标签类型
    approvalTag(status) {
      const statusValue = parseInt(status, 10)
      switch (statusValue) {
        case this.APPROVAL_STATUS_APPROVED:
          return 'success'
        case this.APPROVAL_STATUS_REJECTED:
          return 'danger'
        case this.APPROVAL_STATUS_PENDING:
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
    parseDeviceInfo() {
      this.loadingDeviceInfo = true
      if (this.detail.deviceInfoDetails) {
        try {
          this.parsedDeviceInfo = JSON.parse(this.detail.deviceInfoDetails)
        } catch (e) {
          console.error('解析设备信息失败:', e)
          this.parsedDeviceInfo = {}
        }
      } else {
        this.parsedDeviceInfo = {}
      }
      this.loadingDeviceInfo = false
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
