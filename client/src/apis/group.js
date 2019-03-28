import axios from 'axios'

const API_HOST = process.env.REACT_APP_API_HOST

export default {
	upload: async (activeBot, file) => (await axios.post(`${API_HOST}/chatbot/${activeBot}/upload/`, file)).data,

	create: async activeBot => (await axios.post(`${API_HOST}/chatbot/${activeBot}/faq/`)).data,

	fetch: async (activeBot, page, answer_content='') => (await axios.get(`${API_HOST}/chatbot/${activeBot}/faq/`, { params: { page, answer_content } })).data,

	delete: async (activeBot, id) => (await axios.delete(`${API_HOST}/chatbot/${activeBot}/faq/${id}/`)).data,

	export: async activeBot => (await axios.get(`${API_HOST}/chatbot/${activeBot}/export/`)).data,

	train: async activeBot => (await axios.get(`${API_HOST}/chatbot/${activeBot}/train/`)).data,

	fetchGroup: async (activeBot, id) => (await axios.get(`${API_HOST}/chatbot/${activeBot}/faq/${id}/`)).data,
}
