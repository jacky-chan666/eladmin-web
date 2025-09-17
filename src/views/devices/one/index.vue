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
        width="700px"
      >
        <el-form ref="form" :model="form" :rules="rules" size="small" label-width="100px">

          <!-- 设备信息区块 -->
          <el-card shadow="never" style="margin-bottom: 20px;">
            <div slot="header" style="font-weight: bold; font-size: 16px;">设备信息</div>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="ID">
                  <el-input v-model="form.id" disabled style="width: 100%;" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="模型类型" prop="model">
                  <el-input v-model="form.model" style="width: 100%;" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="模型版本" prop="modelVersion">
                  <el-input v-model="form.modelVersion" style="width: 100%;" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-card>

          <!-- 审核信息区块 -->
          <el-card shadow="never" style="margin-bottom: 20px;">
            <div slot="header" style="font-weight: bold; font-size: 16px;">审核信息</div>
            <el-row :gutter="20">
              <!-- 四类审批人 -->
              <el-col :span="24">
                <el-form-item label="研发接口人" prop="devInterface">
                  <el-select v-model="form.devInterface" filterable placeholder="请选择研发接口人" style="width: 100%;">
                    <el-option
                      v-for="user in devInterfaceUsers"
                      :key="user.id"
                      :label="user.username"
                      :value="user.username"
                    />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="24">
                <el-form-item label="设备接口人" prop="deviceInterface">
                  <el-select v-model="form.deviceInterface" filterable placeholder="请选择设备接口人" style="width: 100%;">
                    <el-option
                      v-for="user in deviceInterfaceUsers"
                      :key="user.id"
                      :label="user.username"
                      :value="user.username"
                    />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="24">
                <el-form-item label="研发组长" prop="devLeader">
                  <el-select v-model="form.devLeader" filterable placeholder="请选择研发组长" style="width: 100%;">
                    <el-option
                      v-for="user in devLeaderUsers"
                      :key="user.id"
                      :label="user.username"
                      :value="user.username"
                    />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="24">
                <el-form-item label="测试组长" prop="testLeader">
                  <el-select v-model="form.testLeader" filterable placeholder="请选择测试组长" style="width: 100%;">
                    <el-option
                      v-for="user in testLeaderUsers"
                      :key="user.id"
                      :label="user.username"
                      :value="user.username"
                    />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="24">
                <el-form-item label="申请人" prop="applicant">
                  <el-input v-model="form.applicant" disabled style="width: 100%;" />
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
  model: null,
  modelVersion: null,
  devInterface: null,
  deviceInterface: null,
  devLeader: null,
  testLeader: null,
  applicant: ''
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
        model: [
          { required: true, message: '模型类型不能为空', trigger: 'blur' }
        ],
        modelVersion: [
          { required: true, message: '模型版本不能为空', trigger: 'blur' }
        ],
        reviewer: [
          { required: true, message: '审核人不能为空', trigger: 'blur' }
        ],
        applicant: [
          { required: true, message: '申请人不能为空', trigger: 'blur' }
        ]
      },
      // 存储各角色的用户列表
      devInterfaceUsers: [],
      deviceInterfaceUsers: [],
      devLeaderUsers: [],
      testLeaderUsers: [],

      queryTypeOptions: [
        { key: 'model', display_name: '模型类型' },
        { key: 'modelVersion', display_name: '模型版本' }
      ]
    }
  },
  methods: {
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
      const applicant = this.$store.getters.name || '系统用户'
      this.form.applicant = applicant

      // 加载所有审批人列表（只加载一次）
      if (this.devInterfaceUsers.length === 0) {
        this.loadApproverUsersByRoles()
      }
      return true
    },

    // 从 API 或 mock 数据加载审批人列表
    loadApproverUsers() {
      // 示例：调用用户管理接口根据角色获取用户
      // 实际应替换为真实接口，如：userService.getUsersByRole('dev_interface')
      const mockUsers = [
        {id: 1, name: '张工', roles: ['dev_interface']},
        {id: 2, name: '李工', roles: ['device_interface']},
        {id: 3, name: '王组长', roles: ['dev_leader']},
        {id: 4, name: '赵组长', roles: ['test_leader']},
        {id: 5, name: '刘工', roles: ['dev_interface', 'dev_leader']},
        {id: 6, name: '陈组长', roles: ['test_leader']}
      ]

      // 按角色分类填充
      this.devInterfaceUsers = mockUsers.filter(u => u.roles.includes('dev_interface'))
      this.deviceInterfaceUsers = mockUsers.filter(u => u.roles.includes('device_interface'))
      this.devLeaderUsers = mockUsers.filter(u => u.roles.includes('dev_leader'))
      this.testLeaderUsers = mockUsers.filter(u => u.roles.includes('test_leader'))
    },

    // 在 methods 中添加新的实现方法
    async loadApproverUsersByRoles() {
      try {
        // 获取所有角色
        const rolesRes = await getAll() // 需要实现这个API调用
        const roles = rolesRes.content || rolesRes

        // 找到对应的角色ID
        const devInterfaceRole = roles.find(role => role.name.includes('研发接口人'))
        const deviceInterfaceRole = roles.find(role => role.name.includes('测试接口人'))
        const devLeaderRole = roles.find(role => role.name.includes('研发组长'))
        const testLeaderRole = roles.find(role => role.name.includes('测试组长'))

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

        if (testLeaderRole) {
          const users = await getUsersByRoleId(testLeaderRole.id)
          this.testLeaderUsers = users.content || users
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
