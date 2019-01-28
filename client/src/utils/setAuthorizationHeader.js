import axios from 'axios'

export default (token = null) => {
	if (token) {
		axios.defaults.headers.common.Authorization = `Bearer ${token}`
		return axios.defaults.headers.common.Authorization
	} else {
		const temp = axios.defaults.headers.common.Authorization
		delete axios.defaults.headers.common.Authorization
		return temp
	}
}
