import axios from 'axios'

const API_HOST = process.env.REACT_APP_API_HOST

export default {
	list: async () => (await axios.get(`${API_HOST}/chatbot/`)).data,

	info: async activeBot => (await axios.get(`${API_HOST}/chatbot/${activeBot}/`)).data,

	history: async (activeBot, page) => (await axios.get(`${API_HOST}/chatbot/${activeBot}/history/`, {
		params: {
			page
		}
	})).data,
	
	matching: async (activeBot, page) => (await axios.get(`${API_HOST}/chatbot/${activeBot}/matching/`, {
		params: {page}
	})).data,

	platforms: async () => (await axios.get(`${API_HOST}/thirdparty/`)).data,

	report: async (activeBot, days) => (await axios.get(`${API_HOST}/chatbot/${activeBot}/report/`, {
		params: { days },
	})).data,

	delete: async activeBot => (await axios.delete(`${API_HOST}/chatbot/${activeBot}/`)).data,

	 /**
	  * Creates a bot
	  * @async
	  * @param {BotInfo} data
	  */
	create: async data => (await axios.post(`${API_HOST}/chatbot/`, data)).data,

	/**
	 * Updates bot basic info
	 * @async
	 * @param {number} activeBot Bot's primary key
	 * @param {BotInfo} data Populated data
	 */
	update: async (activeBot, data) => (await axios.put(`${API_HOST}/chatbot/${activeBot}/`, {
		robot_name: data.robot_name,
		failed_msg: data.failed_msg,
		greeting_msg: data.greeting_msg,
		postback_title: data.postback_title
	})).data,
}
