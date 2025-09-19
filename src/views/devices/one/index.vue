<template>
  <div class="app-container">
    <!--工具栏-->
    <div class="head-container">
      <div v-if="crud.props.searchToggle">
        <!-- 搜索 -->
        <label class="el-form-item-label">模型类型</label>
        <el-input v-model="query.model" clearable placeholder="模型类型" style="width: 185px;" class="filter-item" @keyup.enter.native="crud.toQuery" />
        <label class="el-form-item-label">模型版本</label>
        <el-input v-model="query.modelVersion" clearable placeholder="模型版本" style="width: 185px;" class="filter-item" @keyup.enter.native="crud.toQuery" />
        <rrOperation :crud="crud" />
      </div>

      <!-- CRUD 操作按钮 -->
      <crudOperation :permission="permission" />

      <!-- 表单弹窗 -->
      <el-dialog
        :close-on-click-modal="false"
        :before-close="crud.cancelCU"
        :visible.sync="crud.status.cu > 0"
        :title="crud.status.title"
        width="55%"
        top="3vh"
        style="min-width: 900px;"
      >
        <el-form ref="form" :model="form" :rules="rules" size="small" label-width="100px">

          <!-- 设备信息区块 -->
          <el-card shadow="never" style="margin-bottom: 20px;">
            <div slot="header" style="font-weight: bold; font-size: 16px;">设备信息</div>
            <el-row :gutter="20">
              <!-- 申请单编号 -->
              <el-col :span="24">
                <el-form-item label="申请单编号">
                  <el-input v-model="form.uuid" disabled style="width: 100%;" />
                </el-form-item>
              </el-col>

              <!-- 设备型号 + 设备版本 -->
              <el-col :span="12">
                <el-form-item label="设备型号" prop="deviceDetail.model">
                  <el-input v-model="form.deviceDetail.model" placeholder="如：ER7206, SG2008" style="width: 100%;" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="设备版本" prop="deviceDetail.modelVersion">
                  <el-input v-model="form.deviceDetail.modelVersion" placeholder="如：1.0" style="width: 100%;" />
                </el-form-item>
              </el-col>

              <!-- 设备类型 (model_type) -->
              <el-col :span="12">
                <el-form-item label="设备类型" prop="deviceDetail.modelType">
                  <el-select v-model="form.deviceDetail.modelType" placeholder="请选择设备类型" style="width: 100%;">
                    <el-option label="普通设备 (NORMAL)" value="NORMAL" />
                    <el-option label="Pro设备 (PRO)" value="PRO" />
                    <el-option label="一体机 (COMBINED)" value="COMBINED" />
                    <el-option label="PRO管理普通设备 (PRO_FREE)" value="PRO_FREE" />
                  </el-select>
                </el-form-item>
              </el-col>

              <!-- 设备种类 (type) -->
              <el-col :span="12">
                <el-form-item label="设备种类" prop="deviceDetail.type">
                  <el-select v-model="form.deviceDetail.type" placeholder="请选择设备种类" style="width: 100%;">
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
                <el-form-item label="硬件版本" prop="deviceDetail.hwVersion">
                  <el-input
                    v-model="form.deviceDetail.hwVersion"
                    placeholder="如：v1.2.3（可选）"
                    style="width: 100%;"
                  />
                </el-form-item>
              </el-col>

              <!-- 模版版本 (controller_version) -->
              <el-col :span="12">
                <el-form-item label="模版版本" prop="deviceDetail.controllerVersion">
                  <el-input
                    v-model="form.deviceDetail.controllerVersion"
                    placeholder="如：5.15.21.1"
                    style="width: 100%;"
                    clearable
                  />
                </el-form-item>
              </el-col>

              <!-- 设备版本 (version) -->
              <el-col :span="12">
                <el-form-item label="设备版本号" prop="deviceDetail.version">
                  <el-input
                    v-model="form.deviceDetail.version"
                    placeholder="如：1.0"
                    style="width: 100%;"
                  />
                </el-form-item>
              </el-col>

              <!-- 收养报文 (adopt_resp) -->
              <el-col :span="24">
                <el-form-item label="收养报文" prop="deviceDetail.adoptResp" class="adopt-resp-item">
                  <el-input
                    v-model="form.deviceDetail.adoptResp"
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
          <el-card shadow="never" style="margin-bottom: 20px;">
            <div slot="header" style="font-weight: bold; font-size: 16px;">审核信息</div>
            <el-row :gutter="20">

              <!-- 第一行：研发接口人 + 设备接口人 -->
              <el-col :span="12">
                <el-form-item label="研发接口人" prop="devInterface">
                  <el-select v-model="form.devInterface" filterable placeholder="请选择" size="small" style="width: 100%;">
                    <el-option v-for="user in devInterfaceUsers" :key="user.id" :label="user.username" :value="user.username" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="设备接口人" prop="deviceInterface">
                  <el-select v-model="form.deviceInterface" filterable placeholder="请选择" size="small" style="width: 100%;">
                    <el-option v-for="user in deviceInterfaceUsers" :key="user.id" :label="user.username" :value="user.username" />
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
                <el-form-item label="设备组长" prop="deviceLeader">
                  <el-select v-model="form.deviceLeader" filterable placeholder="请选择" size="small" style="width: 100%;">
                    <el-option v-for="user in deviceLeaderUsers" :key="user.id" :label="user.username" :value="user.username" />
                  </el-select>
                </el-form-item>
              </el-col>

              <!-- 申请人放在最后单独一行（可选） -->
              <el-col :span="24">
                <el-form-item label="申请人" prop="applicantUserName">
                  <el-input v-model="form.applicantUserName" disabled size="small" style="width: 100%;" />
                </el-form-item>
              </el-col>

            </el-row>
          </el-card>

        </el-form>

        <div slot="footer" class="dialog-footer">
          <el-button type="text" @click="crud.cancelCU">取消</el-button>
          <el-button :loading="saveLoading" type="info" @click="handleSave">保存</el-button>
          <el-button :loading="crud.status.cu === 2" type="primary" @click="crud.submitCU">确认</el-button>
        </div>
      </el-dialog>

      <!-- 表格渲染 -->
      <el-table ref="table" v-loading="crud.loading" :data="crud.data" size="small" style="width: 100%;" @selection-change="crud.selectionChangeHandler">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" />
        <el-table-column prop="model" label="模型类型" />
        <el-table-column prop="modelVersion" label="模型版本" />
        <el-table-column v-if="checkPer(['admin','deviceInfo:edit','deviceInfo:del'])" label="操作" width="150px" align="center">
          <template slot-scope="scope">
            <onOperation
              :data="scope.row"
              :permission="permission"
            />
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <pagination />
    </div>
  </div>
</template>


<script>
import crudDeviceInfo from '@/api/deviceInfo'
import CRUD, { presenter, header, form, crud } from '@crud/crud'
import { getAll } from '@/api/system/role'
import { getUsersByRoleId } from '@/api/system/user'
import rrOperation from '@crud/RR.operation'
import crudOperation from '@crud/CRUD.operation'
import onOperation from '@crud/ON.operation'
import pagination from '@crud/Pagination'

// 默认表单值
const defaultForm = {
  id: null,
  uuid: null,
  applicantUserName: '',
  devInterface: null,
  deviceInterface: null,
  devLeader: null,
  deviceLeader: null,
  deviceDetail: {
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
  name: 'DeviceInfo',
  components: { pagination, crudOperation, rrOperation, onOperation },
  mixins: [presenter(), header(), form(defaultForm), crud()],
  cruds() {
    return CRUD({
      title: '测试生成',
      url: 'api/deviceInfo',
      idField: 'id',
      sort: 'id,desc',
      crudMethod: { ...crudDeviceInfo },
      optShow: { add: true, edit: true, del: false }
    })
  },
  data() {
    return {
      saveLoading: false,
      permission: {
        add: ['admin', 'deviceInfo:add'],
        edit: ['admin', 'deviceInfo:edit'],
        del: ['admin', 'deviceInfo:del'],
        online: ['admin', 'deviceInfo:online'],
        offline: ['admin', 'deviceInfo:offline']
      },
      rules: {
        'deviceDetail.model': [
          { required: true, message: '设备型号不能为空', trigger: 'blur' }
        ],
        'deviceDetail.modelVersion': [
          { required: true, message: '设备版本不能为空', trigger: 'blur' }
        ],
        'deviceDetail.modelType': [
          { required: true, message: '请选择设备类型', trigger: 'change' }
        ],
        'deviceDetail.type': [
          { required: true, message: '请选择设备种类', trigger: 'change' }
        ],
        'deviceDetail.controllerVersion': [
          { required: true, message: '模版版本不能为空', trigger: 'blur' }
        ],
        'deviceDetail.version': [
          { required: true, message: '设备版本不能为空', trigger: 'blur' }
        ],
        'deviceDetail.adoptResp': [
          { required: true, message: '收养报文不能为空', trigger: 'blur' },
          { validator: this.validateAdoptResp, trigger: 'blur' }
        ]
        // === 审核信息校验规则 ===
        // devInterface: [
        //   { required: true, message: '请选择研发接口人', trigger: 'change' }
        // ],
        // deviceInterface: [
        //   { required: true, message: '请选择设备接口人', trigger: 'change' }
        // ],
        // devLeader: [
        //   { required: true, message: '请选择研发组长', trigger: 'change' }
        // ],
        // deviceLeader: [
        //   { required: true, message: '请选择设备组长', trigger: 'change' }
        // ]
      },
      // 存储各角色的用户列表
      devInterfaceUsers: [],
      deviceInterfaceUsers: [],
      devLeaderUsers: [],
      deviceLeaderUsers: [],

      queryTypeOptions: [
        { key: 'model', display_name: '模型类型' },
        { key: 'modelVersion', display_name: '模型版本' }
      ]
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
    async handleSave() {
      this.saveLoading = true
      try {
        // 验证表单
        await this.$refs.form.validate()

        // 根据是新增还是编辑执行不同操作
        if (this.crud.status.add === 1) {
          // 新增
          await crudDeviceInfo.add(this.form)
          this.$message.success('保存成功')
          this.crud.cancelCU()
          this.crud.toQuery()
        } else if (this.crud.status.edit === 1) {
          // 编辑
          await crudDeviceInfo.edit(this.form)
          this.$message.success('保存成功')
          this.crud.cancelCU()
          this.crud.refresh()
        }
      } catch (error) {
        console.error('保存失败', error)
        this.$message.error('保存失败')
      } finally {
        this.saveLoading = false
      }
    },
    // 在打开表单前填充申请人信息
    [CRUD.HOOK.beforeToCU](crud) {
      // 从 Vuex 获取申请人（例如用户名）
      const applicantUserName = this.$store.getters.user.username || '系统用户'
      this.form.applicantUserName = applicantUserName

      // 加载所有审批人列表（只加载一次）
      if (this.devInterfaceUsers.length === 0) {
        this.loadApproverUsersByRoles()
      }
      return true
    },

    // 在 methods 中添加新的实现方法
    async loadApproverUsersByRoles() {
      try {
        // 获取所有角色
        const rolesRes = await getAll() // 需要实现这个API调用
        const roles = rolesRes.content || rolesRes

        // 找到对应的角色ID
        const devInterfaceRole = roles.find(role => role.name.includes('研发接口人'))
        const deviceInterfaceRole = roles.find(role => role.name.includes('设备接口人'))
        const devLeaderRole = roles.find(role => role.name.includes('研发组长'))
        const deviceLeaderRole = roles.find(role => role.name.includes('设备组长'))

        // 根据角色ID获取对应的用户（如果后端支持按角色查询用户）
        if (devInterfaceRole) {
          const users = await getUsersByRoleId(devInterfaceRole.id) // 需要实现这个API调用
          this.devInterfaceUsers = users.content || users
        }

        if (deviceInterfaceRole) {
          const users = await getUsersByRoleId(deviceInterfaceRole.id)
          this.deviceInterfaceUsers = users.content || users
        }

        if (devLeaderRole) {
          const users = await getUsersByRoleId(devLeaderRole.id)
          this.devLeaderUsers = users.content || users
        }

        if (deviceLeaderRole) {
          const users = await getUsersByRoleId(deviceLeaderRole.id)
          this.deviceLeaderUsers = users.content || users
        }
      } catch (error) {
        console.error('获取审批人列表失败:', error)
        this.$message.error('获取审批人列表失败')
      }
    },

    // 钩子：刷新前
    [CRUD.HOOK.beforeRefresh]() {
      return true
    }
  }
}
</script>

<style scoped>
/* 可以根据需要添加样式 */
</style>

