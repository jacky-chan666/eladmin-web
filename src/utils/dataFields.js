// 设备字段配置管理文件
// 用于统一管理不同设备类型的字段配置

// 应用数据类型常量定义
export const APPLICATION_DATA_TYPE = {
  DEVICE: 1,  // 设备信息
  GATEWAY: 2  // 网关信息
}

// 应用类型常量定义
export const APPLICATION_TYPE = {
  ADD: 1,     // 新增
  EDIT: 2,    // 编辑
  ONLINE: 3,  // 上线
  OFFLINE: 4  // 下线
}

// 审批状态常量定义
export const APPROVAL_STATUS = {
  PENDING: 0,   // 待审批
  APPROVED: 1,  // 通过
  REJECTED: 2   // 驳回
}

// 申请单状态常量定义
export const APPLICATION_STATUS = {
  DRAFT: -1,              // 草稿
  SUBMITTED: 0,           // 已提交
  PENDING: 1,             // 待审批
  APPROVED: 2,            // 审批通过
  FIRMWARE_VERIFY: 3,     // 固件校验中
  FIRMWARE_FAILED: 4,     // 固件校验失败
  SYNCING: 5,             // 同步中
  SYNC_FAILED: 6,         // 同步失败
  COMPLETED: 7,           // 已完成
  REJECTED: 8,            // 已驳回
  AUTO_PROCESSING: 9,     // 自动处理中
  AUTO_FAILED: 10,        // 自动处理失败
  MANUAL_TRIGGERED: 11,   // 手动触发
  WITHDRAWN: 12           // 已撤回
}

// 审核人配置
export const APPROVER_CONFIG = [
  {
    key: 'devContact',
    label: '研发接口人',
    roleKeyword: '研发接口人',
    prop: 'devContact',
    usersProp: 'devContactUsers'  // 添加usersProp字段，用于映射组件中的属性名
  },
  {
    key: 'testContact',
    label: '测试接口人',
    roleKeyword: '测试接口人',
    prop: 'testContact',
    usersProp: 'testContactUsers'  // 添加usersProp字段，用于映射组件中的属性名
  },
  {
    key: 'devLeader',
    label: '研发组长',
    roleKeyword: '研发组长',
    prop: 'devLeader',
    usersProp: 'devLeaderUsers'  // 添加usersProp字段，用于映射组件中的属性名
  },
  {
    key: 'testLeader',
    label: '测试组长',
    roleKeyword: '测试组长',
    prop: 'testLeader',
    usersProp: 'testLeaderUsers'  // 添加usersProp字段，用于映射组件中的属性名
  }
]

// 审批人状态属性映射
export const APPROVER_STATUS_PROPS = {
  devContact: 'devContactApproval',
  testContact: 'testContactApproval',
  devLeader: 'devLeaderApproval',
  testLeader: 'testLeaderApproval'
}

// 审批人意见属性映射
export const APPROVER_COMMENT_PROPS = {
  devContact: 'devContactComment',
  testContact: 'testContactComment',
  devLeader: 'devLeaderComment',
  testLeader: 'testLeaderComment'
}

// 第一种设备类型字段配置 (applicationDataType = 1)
export const dataType1Fields = [
  {
    label: '设备型号',
    prop: 'model',
    required: true,
    placeholder: '如：ER7206, SG2008',
    type: 'input'
  },
  {
    label: '设备版本',
    prop: 'modelVersion',
    required: true,
    placeholder: '如：1.0',
    type: 'input'
  },
  {
    label: '设备类型',
    prop: 'modelType',
    required: true,
    placeholder: '请选择设备类型',
    type: 'select',
    options: [
      { label: '普通设备 (NORMAL)', value: 'NORMAL' },
      { label: 'Pro设备 (PRO)', value: 'PRO' },
      { label: '一体机 (COMBINED)', value: 'COMBINED' },
      { label: 'PRO管理普通设备 (PRO_FREE)', value: 'PRO_FREE' }
    ]
  },
  {
    label: '设备种类',
    prop: 'type',
    required: true,
    placeholder: '请选择设备种类',
    type: 'select',
    options: [
      { label: '网关 (gateway)', value: 'gateway' },
      { label: '交换机 (switch)', value: 'switch' },
      { label: 'AP (ap)', value: 'ap' },
      { label: 'OLT (olt)', value: 'olt' },
      { label: '其他', value: 'other' }
    ]
  },
  {
    label: '硬件版本',
    prop: 'hwVersion',
    required: false,
    placeholder: '如：v1.2.3（可选）',
    type: 'input'
  },
  {
    label: '模版版本',
    prop: 'controllerVersion',
    required: true,
    placeholder: '如：5.15.21.1',
    type: 'input'
  },
  {
    label: '设备版本号',
    prop: 'version',
    required: true,
    placeholder: '如：1.0',
    type: 'input'
  },
  {
    label: '收养报文',
    prop: 'adoptResp',
    required: true,
    placeholder: '请填写转义后的JSON字符串，例如：{"modelId": "123"}',
    type: 'textarea',
    rows: 4
  }
]

// 第二种设备类型字段配置 (applicationDataType = 2)
export const dataType2Fields = [
  {
    label: 'sb模型类型',
    prop: 'model',
    required: true,
    placeholder: '请输入sb模型类型',
    type: 'input'
  },
  {
    label: 'sb模型版本',
    prop: 'modelVersion',
    required: true,
    placeholder: '请输入sb模型版本',
    type: 'input'
  },
  {
    label: 'sb设备名称',
    prop: 'sbname',
    required: true,
    placeholder: '请输入sb设备名称',
    type: 'input'
  },
  {
    label: 'sb设备类型',
    prop: 'type',
    required: true,
    placeholder: '请输入sb设备类型',
    type: 'input'
  },
  {
    label: '制造商',
    prop: 'manufacturer',
    required: true,
    placeholder: '请输入制造商',
    type: 'input'
  },
  {
    label: '规格参数',
    prop: 'specifications',
    required: true,
    placeholder: '请输入规格参数',
    type: 'input'
  },
  {
    label: '状态：0-下线，1-上线',
    prop: 'status',
    required: true,
    placeholder: '请输入状态',
    type: 'input'
  },
  {
    label: '创建时间',
    prop: 'createdAt',
    required: false,
    placeholder: '请输入创建时间',
    type: 'input'
  }
]

// 根据设备数据类型获取字段配置
export function getDataFieldsByType(applicationDataType) {
  switch (applicationDataType) {
    case APPLICATION_DATA_TYPE.DEVICE:
      return dataType1Fields
    case APPLICATION_DATA_TYPE.GATEWAY:
      return dataType2Fields
    default:
      return dataType1Fields // 默认使用第一种设备类型字段
  }
}

// 根据设备数据类型获取校验规则
export function getDataRulesByType(applicationDataType) {
  const rules = {}

  switch (applicationDataType) {
    case APPLICATION_DATA_TYPE.DEVICE:
      rules['dataDetails.model'] = [
        { required: true, message: '设备型号不能为空', trigger: 'blur' }
      ]
      rules['dataDetails.modelVersion'] = [
        { required: true, message: '设备版本不能为空', trigger: 'blur' }
      ]
      rules['dataDetails.modelType'] = [
        { required: true, message: '请选择设备类型', trigger: 'change' }
      ]
      rules['dataDetails.type'] = [
        { required: true, message: '请选择设备种类', trigger: 'change' }
      ]
      rules['dataDetails.controllerVersion'] = [
        { required: true, message: '模版版本不能为空', trigger: 'blur' }
      ]
      rules['dataDetails.version'] = [
        { required: true, message: '设备版本不能为空', trigger: 'blur' }
      ]
      rules['dataDetails.adoptResp'] = [
        { required: true, message: '收养报文不能为空', trigger: 'blur' }
      ]
      break

    case APPLICATION_DATA_TYPE.GATEWAY:
      rules['dataDetails.model'] = [
        { required: true, message: 'sb模型类型不能为空', trigger: 'blur' }
      ]
      rules['dataDetails.modelVersion'] = [
        { required: true, message: 'sb模型版本不能为空', trigger: 'blur' }
      ]
      rules['dataDetails.sbname'] = [
        { required: true, message: 'sb设备名称不能为空', trigger: 'blur' }
      ]
      rules['dataDetails.type'] = [
        { required: true, message: 'sb设备类型不能为空', trigger: 'blur' }
      ]
      rules['dataDetails.manufacturer'] = [
        { required: true, message: '制造商不能为空', trigger: 'blur' }
      ]
      rules['dataDetails.specifications'] = [
        { required: true, message: '规格参数不能为空', trigger: 'blur' }
      ]
      rules['dataDetails.status'] = [
        { required: true, message: '状态不能为空', trigger: 'blur' }
      ]
      break

    default:
      // 默认使用第一种设备类型的规则
      rules['dataDetails.model'] = [
        { required: true, message: '设备型号不能为空', trigger: 'blur' }
      ]
      rules['dataDetails.modelVersion'] = [
        { required: true, message: '设备版本不能为空', trigger: 'blur' }
      ]
      rules['dataDetails.modelType'] = [
        { required: true, message: '请选择设备类型', trigger: 'change' }
      ]
      rules['dataDetails.type'] = [
        { required: true, message: '请选择设备种类', trigger: 'change' }
      ]
      rules['dataDetails.controllerVersion'] = [
        { required: true, message: '模版版本不能为空', trigger: 'blur' }
      ]
      rules['dataDetails.version'] = [
        { required: true, message: '设备版本不能为空', trigger: 'blur' }
      ]
      rules['dataDetails.adoptResp'] = [
        { required: true, message: '收养报文不能为空', trigger: 'blur' }
      ]
  }

  return rules
}

// 根据审批状态获取状态名称
export function getApprovalStatusName(status) {
  const statusMap = {
    [APPROVAL_STATUS.PENDING]: '待审批',
    [APPROVAL_STATUS.APPROVED]: '通过',
    [APPROVAL_STATUS.REJECTED]: '驳回'
  }
  return statusMap[status] || '未审核'
}

// 根据申请单状态获取状态名称
export function getApplicationStatusName(status) {
  const statusMap = {
    [APPLICATION_STATUS.DRAFT]: '草稿',
    [APPLICATION_STATUS.SUBMITTED]: '已提交',
    [APPLICATION_STATUS.PENDING]: '待审批',
    [APPLICATION_STATUS.APPROVED]: '审批通过',
    [APPLICATION_STATUS.FIRMWARE_VERIFY]: '固件校验中',
    [APPLICATION_STATUS.FIRMWARE_FAILED]: '固件校验失败',
    [APPLICATION_STATUS.SYNCING]: '同步中',
    [APPLICATION_STATUS.SYNC_FAILED]: '同步失败',
    [APPLICATION_STATUS.COMPLETED]: '已完成',
    [APPLICATION_STATUS.REJECTED]: '已驳回',
    [APPLICATION_STATUS.AUTO_PROCESSING]: '自动处理中',
    [APPLICATION_STATUS.AUTO_FAILED]: '自动处理失败',
    [APPLICATION_STATUS.MANUAL_TRIGGERED]: '手动触发',
    [APPLICATION_STATUS.WITHDRAWN]: '已撤回'
  }
  return statusMap[status] || '未知状态'
}

// 根据申请单类型获取类型名称
export function getApplicationTypeName(type) {
  const typeMap = {
    [APPLICATION_TYPE.ADD]: '新增',
    [APPLICATION_TYPE.EDIT]: '编辑',
    [APPLICATION_TYPE.ONLINE]: '上线',
    [APPLICATION_TYPE.OFFLINE]: '下线'
  }
  return typeMap[type] || '未知'
}

// 根据设备数据类型获取类型名称
export function getApplicationDataTypeName(type) {
  const typeMap = {
    [APPLICATION_DATA_TYPE.DEVICE]: '第一种设备类型',
    [APPLICATION_DATA_TYPE.GATEWAY]: '第二种设备类型'
  }
  return typeMap[type] || '未知'
}

// 根据设备类型获取名称
export function getModelTypeName(type) {
  const typeMap = {
    'NORMAL': '普通设备',
    'PRO': 'Pro设备',
    'COMBINED': '一体机',
    'PRO_FREE': 'PRO管理普通设备'
  }
  return typeMap[type] || type || '未知'
}

// 根据设备种类获取名称
export function getDeviceTypeName(type) {
  const typeMap = {
    'gateway': '网关',
    'switch': '交换机',
    'ap': 'AP',
    'olt': 'OLT',
    'other': '其他'
  }
  return typeMap[type] || type || '未知'
}
