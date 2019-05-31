import axios from 'axios'

const API_HOST = process.env.REACT_APP_API_HOST + '/agent'

export default {
	fetchAll: async () => (await axios.get(`${API_HOST}/module/`)).data,

	fetch: async templateId => (await axios.get(`${API_HOST}/module/${templateId}/`)).data,

	create: async data => (await axios.post(`${API_HOST}/module/`, data)).data,

	update: async (templateId, data) => (await axios.put(`${API_HOST}/module/${templateId}/`, data)).data,

	delete: async templateId => (await axios.delete(`${API_HOST}/module/${templateId}/`)).data,

	fetchGroups: async templateId => (await axios.get(`${API_HOST}/module/${templateId}/faq/`)).data,

	fetchGroup: async (templateId, groupId) => (await axios.get(`${API_HOST}/module/${templateId}/faq/${groupId}/`)).data,

	createGroup: async templateId => (await axios.post(`${API_HOST}/module/${templateId}/faq/`)).data,

	deleteGroup: async (templateId, groupId) => (await axios.delete(`${API_HOST}/module/${templateId}/faq/${groupId}/`)).data,

	createQuestion: async (templateId, groupId, data) => (await axios.post(`${API_HOST}/module/${templateId}/question/`, {
		group: groupId,
		content: data
	})).data,

	updateQuestion: async (templateId, questionId, data) => (await axios.put(`${API_HOST}/module/${templateId}/question/${questionId}/`, data)).data,

	deleteQuestion: async (templateId, questionId) => (await axios.delete(`${API_HOST}/module/${templateId}/question/${questionId}/`)).data,

	createAnswer: async (templateId, groupId, data) => (await axios.post(`${API_HOST}/module/${templateId}/answer/`, {
		group: groupId,
		content: data
	})).data,

	updateAnswer: async (templateId, answerId, data) => (await axios.put(`${API_HOST}/module/${templateId}/answer/${answerId}/`, data)).data,

	deleteAnswer: async (templateId, answerId) => (await axios.delete(`${API_HOST}/module/${templateId}/answer/${answerId}/`)).data,

	upload: async (templateId, file) => (await axios.post(`${API_HOST}/module/${templateId}/upload/`, file)).data,

	export: async templateId => (await axios.get(`${API_HOST}/module/${templateId}/export/`)).data
}