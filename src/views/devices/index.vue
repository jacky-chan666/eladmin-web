<template>
  <div class="app-container">
    <!--工具栏-->
    <div class="head-container">
      <div v-if="crud.props.searchToggle">
        <!-- 搜索 -->
        <el-input v-model="query.name" clearable size="small" placeholder="输入设备名称搜索" style="width: 200px;" class="filter-item" @keyup.enter.native="crud.toQuery" />
        <date-range-picker v-model="query.createTime" class="date-item" />
        <el-select v-model="query.status" clearable size="small" placeholder="状态" class="filter-item" style="width: 90px" @change="crud.toQuery">
          <el-option v-for="item in statusOptions" :key="item.key" :label="item.display_name" :value="item.key" />
        </el-select>
        <rrOperation />
      </div>
      <crudOperation :permission="permission" />
    </div>

    <!--设备详情表单-->
    <el-dialog append-to-body :close-on-click-modal="false" :visible.sync="deviceDetailVisible" :title="deviceDetailTitle" width="600px">
      <el-form ref="deviceDetailForm" :model="deviceDetail" label-width="120px" size="small" disabled>
        <el-form-item label="设备名称：">
          <el-input v-model="deviceDetail.name" />
        </el-form-item>
        <el-form-item label="设备类型：">
          <el-input v-model="deviceDetail.type" />
        </el-form-item>
        <el-form-item label="设备型号：">
          <el-input v-model="deviceDetail.model" />
        </el-form-item>
        <el-form-item label="Controller版本号：">
          <el-input v-model="deviceDetail.controllerVersion" />
        </el-form-item>
        <el-form-item label="收养报文：">
          <el-input v-model="deviceDetail.adoptionMessage" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="设备能力值：">
          <el-input v-model="deviceDetail.capability" />
        </el-form-item>
        <el-form-item label="天线增益：">
          <el-input v-model="deviceDetail.antennaGain" />
        </el-form-item>
        <el-form-item label="设备状态：">
          <el-select v-model="deviceDetail.status" placeholder="请选择">
            <el-option
              v-for="item in statusOptions"
              :key="item.key"
              :label="item.display_name"
              :value="item.key">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="deviceDetailVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <!--表格渲染-->
    <el-table ref="table" v-loading="crud.loading" :data="crud.data" style="width: 100%;" @selection-change="crud.selectionChangeHandler">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="name" label="设备名称" />
      <el-table-column prop="type" label="设备类型" />
      <el-table-column prop="model" label="设备型号" />
      <el-table-column prop="controllerVersion" label="Controller版本号" />
      <el-table-column prop="status" label="设备状态">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 'active' ? 'success' : scope.row.status === 'inactive' ? 'warning' : 'danger'">
            {{ statusOptions.find(item => item.key === scope.row.status).display_name }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100px" align="center" fixed="right">
        <template slot-scope="scope">
          <el-button size="mini" type="text" @click="showDeviceDetail(scope.row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!--分页组件-->
    <pagination />
  </div>
</template>

<script>
import CRUD, { presenter, header, crud } from '@crud/crud'
import rrOperation from '@crud/RR.operation'
import crudOperation from '@crud/CRUD.operation'
import pagination from '@crud/Pagination'
import DateRangePicker from '@/components/DateRangePicker'

// 模拟API接口
const deviceApi = {
  // 获取设备列表
  getDevices: (params) => {
    return new Promise(resolve => {
      setTimeout(() => {
        const mockData = {
          content: [
            {
              id: 1,
              name: '路由器001',
              type: '无线路由器',
              model: 'TL-WR841N',
              controllerVersion: 'v1.2.3',
              status: 'active',
              adoptionMessage: '设备上线请求报文内容...',
              capability: '支持802.11n, 300Mbps',
              antennaGain: '5dBi',
              createTime: '2023-01-01 12:00:00'
            },
            {
              id: 2,
              name: '交换机001',
              type: '千兆交换机',
              model: 'TL-SG1005D',
              controllerVersion: 'v2.1.0',
              status: 'inactive',
              adoptionMessage: '设备注册报文内容...',
              capability: '5个千兆端口',
              antennaGain: 'N/A',
              createTime: '2023-01-02 14:30:00'
            },
            {
              id: 3,
              name: 'AP001',
              type: '无线接入点',
              model: 'TL-WA801ND',
              controllerVersion: 'v1.0.5',
              status: 'active',
              adoptionMessage: '设备认证报文内容...',
              capability: '支持802.11n, 150Mbps',
              antennaGain: '3dBi',
              createTime: '2023-01-03 10:15:00'
            }
          ],
          totalElements: 3
        }
        resolve({ data: mockData })
      }, 500)
    })
  },

  // 获取设备详情
  getDevice: (id) => {
    return new Promise(resolve => {
      setTimeout(() => {
        const mockDetail = {
          id: id,
          name: '路由器001',
          type: '无线路由器',
          model: 'TL-WR841N',
          controllerVersion: 'v1.2.3',
          status: 'active',
          adoptionMessage: '设备上线请求报文内容，包含设备标识、认证信息等详细内容...',
          capability: '支持802.11n, 300Mbps, 2x2 MIMO, IPv6支持',
          antennaGain: '5dBi 内置天线',
          createTime: '2023-01-01 12:00:00'
        }
        if (id == 2) {
          mockDetail.name = '交换机001'
          mockDetail.type = '千兆交换机'
          mockDetail.model = 'TL-SG1005D'
          mockDetail.controllerVersion = 'v2.1.0'
          mockDetail.status = 'inactive'
          mockDetail.adoptionMessage = '设备注册报文内容，包含设备序列号、硬件版本等信息...'
          mockDetail.capability = '5个千兆端口, 全双工, 自适应速率'
          mockDetail.antennaGain = 'N/A'
          mockDetail.createTime = '2023-01-02 14:30:00'
        } else if (id == 3) {
          mockDetail.name = 'AP001'
          mockDetail.type = '无线接入点'
          mockDetail.model = 'TL-WA801ND'
          mockDetail.controllerVersion = 'v1.0.5'
          mockDetail.status = 'active'
          mockDetail.adoptionMessage = '设备认证报文内容，包含认证密钥、设备证书等...'
          mockDetail.capability = '支持802.11n, 150Mbps, 单频段, IPv4/IPv6'
          mockDetail.antennaGain = '3dBi 外置天线'
          mockDetail.createTime = '2023-01-03 10:15:00'
        }
        resolve({ data: mockDetail })
      }, 300)
    })
  }
}

export default {
  name: 'Device',
  components: { pagination, crudOperation, rrOperation, DateRangePicker },
  cruds() {
    return CRUD({
      title: '设备',
      url: 'api/devices',
      crudMethod: {
        ...deviceApi
      }
    })
  },
  mixins: [presenter(), header(), crud()],
  data() {
    return {
      deviceDetailVisible: false,
      deviceDetailTitle: '设备详情',
      deviceDetail: {
        id: null,
        name: '',
        type: '',
        model: '',
        controllerVersion: '',
        adoptionMessage: '',
        capability: '',
        antennaGain: '',
        status: '',
        createTime: ''
      },
      statusOptions: [
        { key: 'active', display_name: '在线' },
        { key: 'inactive', display_name: '离线' },
        { key: 'fault', display_name: '故障' }
      ],
      permission: {
        add: ['admin', 'device:add'],
        edit: ['admin', 'device:edit'],
        del: ['admin', 'device:del']
      }
    }
  },
  methods: {
    // 显示设备详情
    showDeviceDetail(device) {
      deviceApi.getDevice(device.id).then(res => {
        this.deviceDetail = { ...res.data }
        this.deviceDetailVisible = true
      })
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
</style>
