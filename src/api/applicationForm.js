import request from '@/utils/request'

export function add(data) {
  return request({
    url: 'api/applicationForm',
    method: 'post',
    data
  })
}

export function del(ids) {
  return request({
    url: 'api/applicationForm/',
    method: 'delete',
    data: ids
  })
}

export function edit(data) {
  return request({
    url: 'api/applicationForm',
    method: 'put',
    data
  })
}

// 审批申请单
export function approveApplication(applicationFormId, approverUserName, approvalStatus, comment) {
  return request({
    url: 'api/applicationForm/approve',
    method: 'post',
    params: {
      applicationFormId,
      approverUserName,
      approvalStatus,
      comment
    }
  })
}

export function submitApplication(data) {
  return request({
    url: 'api/applicationForm/submit',
    method: 'post',
    data
  })
}

// 新增保存草稿功能
export function saveDraft(data) {
  return request({
    url: 'api/applicationForm/save-draft',
    method: 'post',
    data
  })
}

// 撤回申请单功能
export function withdrawApplication(applicationFormId, applicantUserName) {
  return request({
    url: 'api/applicationForm/withdraw',
    method: 'post',
    params: {
      applicationFormId,
      applicantUserName
    }
  })
}

// 删除申请单功能
export function deleteApplicationForm(applicationFormId, applicantUserName) {
  return request({
    url: 'api/applicationForm/delete',
    method: 'post',
    params: {
      applicationFormId,
      applicantUserName
    }
  })
}

export default { add, edit, del }
