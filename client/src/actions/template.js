import * as types from '../types'
import api from '../apis/template'
import template from '../apis/template';

export const actionFetchTemplates = data =>({
	type: types.FETCH_TEMPLATES,
	data
})

export const actionFetchTemplate = (templateId, data) => ({
	type: types.FETCH_TEMPLATE,
	templateId,
	data
})

export const actionFetchTemplateGroups = (templateId, data) => ({
	type: types.FETCH_TEMPLATE_FAQ_GROUPS,
	templateId,
	data
})

export const actionFetchTemplateGroup = (templateId, groupId, data) => ({
	type: types.FETCH_TEMPLATE_FAQ_GROUP,
	templateId,
	groupId,
	data
})

export const fetchTemplates = () => dispatch => api.fetchAll()
	.then(data => dispatch(actionFetchTemplates(data)))

export const fetchTemplate = templateId => dispatch => api.fetch(templateId)
	.then(data => dispatch(actionFetchTemplate(templateId, data)))

export const fetchTemplateFAQGroups = templateId => dispatch => api.fetchGroups(templateId)
	.then(data => dispatch(actionFetchTemplateGroups(templateId, data)))

export const fetchTemplateFAQGroup = (templateId, groupId) => dispatch => api.fetchGroup(templateId, groupId)
	.then(data => dispatch(actionFetchTemplateGroup(templateId, groupId, data)))

export const createTemplate = data => dispatch => api.create(data)

export const updateTemplate = (templateId, data) => dispatch => api.update(templateId, data)

export const deleteTemplate = templateId => dispatch => api.delete(templateId)

export const exportFAQ = templateId => dispatch => api.export(templateId)

export const uploadFAQ = (templateId, file) => dispatch => api.upload(templateId, file)

export const createTemplateFAQGroup = templateId => dispatch => api.createGroup(templateId)

export const deleteTemplateFAQGroup = (templateId, groupId) => dispatch => api.deleteGroup(templateId, groupId)

export const createTemplateQuestion = (templateId, groupId, data) => dispatch => api.createQuestion(templateId, groupId, data)

export const createTemplateAnswer = (templateId, groupId, data) => dispatch => api.createAnswer(templateId, groupId, data)

export const updateTemplateQuestion = (templateId, questionId, data) => dispatch => api.updateQuestion(templateId, questionId, data)

export const updateTemplateAnswer = (templateId, answerId, data) => dispatch => api.updateAnswer(templateId, answerId, data)

export const deleteTemplateQuestion = (templateId, questionId) => dispatch => api.deleteQuestion(templateId, questionId)

export const deleteTemplateAnswer = (templateId, answerId) => dispatch => api.deleteAnswer(templateId, answerId)