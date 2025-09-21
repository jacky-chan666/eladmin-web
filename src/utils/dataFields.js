// 设备字段配置管理文件
// 用于统一管理不同设备类型的字段配置

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
    case 1:
      return dataType1Fields
    case 2:
      return dataType2Fields
    default:
      return dataType1Fields // 默认使用第一种设备类型字段
  }
}

// 根据设备数据类型获取校验规则
export function getDataRulesByType(applicationDataType) {
  const rules = {}

  switch (applicationDataType) {
    case 1:
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

    case 2:
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
