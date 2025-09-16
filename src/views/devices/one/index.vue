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
      <!--如果想在工具栏加入更多按钮，可以使用插槽方式， slot = 'left' or 'right'-->
      <crudOperation :permission="permission" />
      <!--表单组件-->
      <el-dialog :close-on-click-modal="false" :before-close="crud.cancelCU" :visible.sync="crud.status.cu > 0" :title="crud.status.title" width="500px">
        <el-form ref="form" :model="form" :rules="rules" size="small" label-width="80px">
          <el-form-item label="ID">
            <el-input v-model="form.id" style="width: 370px;" />
          </el-form-item>
          <el-form-item label="模型类型" prop="model">
            <el-input v-model="form.model" style="width: 370px;" />
          </el-form-item>
          <el-form-item label="模型版本" prop="modelVersion">
            <el-input v-model="form.modelVersion" style="width: 370px;" />
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button type="text" @click="crud.cancelCU">取消</el-button>
          <el-button :loading="crud.status.cu === 2" type="primary" @click="crud.submitCU">确认</el-button>
        </div>
      </el-dialog>
      <!--表格渲染-->
      <el-table ref="table" v-loading="crud.loading" :data="crud.data" size="small" style="width: 100%;" @selection-change="crud.selectionChangeHandler">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" />
        <el-table-column prop="model" label="模型类型" />
        <el-table-column prop="modelVersion" label="模型版本" />
        <el-table-column v-if="checkPer(['admin','deviceInfo:edit','deviceInfo:del'])" label="操作" width="150px" align="center">
          <template slot-scope="scope">
<!--            <udOperation-->
<!--              :data="scope.row"-->
<!--              :permission="permission"-->
<!--            />-->
            <onOperation
              :data="scope.row"
              :permission="permission"
            />
          </template>
        </el-table-column>
      </el-table>
      <!--分页组件-->
      <pagination />
    </div>
  </div>
</template>

<script>
import crudDeviceInfo from '@/api/deviceInfo'

import CRUD, { presenter, header, form, crud } from '@crud/crud'
import rrOperation from '@crud/RR.operation'
import crudOperation from '@crud/CRUD.operation'
// import udOperation from '@crud/UD.operation'
import onOperation from '@crud/ON.operation'
import pagination from '@crud/Pagination'

const defaultForm = { id: null, model: null, modelVersion: null }
export default {
  name: 'DeviceInfo',
  // components: { pagination, crudOperation, rrOperation, udOperation },
  components: { pagination, crudOperation, rrOperation, onOperation },
  mixins: [presenter(), header(), form(defaultForm), crud()],
  cruds() {
    return CRUD({ title: '测试生成', url: 'api/deviceInfo', idField: 'id', sort: 'id,desc', crudMethod: { ...crudDeviceInfo },
      optshow: { add: true, edit: true, del: false }})
  },
  data() {
    return {
      permission: {
        add: ['admin', 'deviceInfo:add'],
        edit: ['admin', 'deviceInfo:edit'],
        del: ['admin', 'deviceInfo:del']
      },
      rules: {
        model: [
          { required: true, message: '模型类型不能为空', trigger: 'blur' }
        ],
        modelVersion: [
          { required: true, message: '模型版本不能为空', trigger: 'blur' }
        ]
      },
      queryTypeOptions: [
        { key: 'model', display_name: '模型类型' },
        { key: 'modelVersion', display_name: '模型版本' }
      ]
    }
  },
  methods: {
    // 钩子：在获取表格数据之前执行，false 则代表不获取数据
    [CRUD.HOOK.beforeRefresh]() {
      return true
    }
  }
}
</script>

<style scoped>

</style>
