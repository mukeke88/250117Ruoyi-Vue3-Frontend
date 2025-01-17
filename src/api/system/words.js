import request from '@/utils/request'

// 查询单词列表
export function listWords(query) {
  return request({
    url: '/system/words/list',
    method: 'get',
    params: query
  })
}

// 查询单词详细
export function getWords(wordId) {
  return request({
    url: '/system/words/' + wordId,
    method: 'get'
  })
}

// 新增单词
export function addWords(data) {
  return request({
    url: '/system/words',
    method: 'post',
    data: data
  })
}

// 修改单词
export function updateWords(data) {
  return request({
    url: '/system/words',
    method: 'put',
    data: data
  })
}

// 删除单词
export function delWords(wordId) {
  return request({
    url: '/system/words/' + wordId,
    method: 'delete'
  })
}