import axiosGlobal from 'axios'

let accLang = 'en-us'
switch (localStorage.i18nextLng) {
	case 'zh-TW': accLang = 'zh-hant'; break;
	case 'zh-CN': accLang = 'zh-hans'; break;
	default: accLang = 'en-us'
}

const requestFailedInterceptor = err => {
	return Promise.reject({
		message: err.request.statusText,
		status: err.request.status,
		xhr: err
	})
}

export const memberAxios = (() => {
	const axios = axiosGlobal.create({
		headers: {
			common: {
				Authorization: localStorage.getItem('token'),
				'Accept-Language': accLang
			}
		}
	})

	axios.interceptors.request.use(request => Promise.resolve(request), requestFailedInterceptor)

	axios.interceptors.response.use(response => {
		return Promise.resolve(response)
	}, err => {
		const message = err.response.data.errors || err.response.data.detail
		if (err.response) {
			if (err.response.status === 401) {
				// User logged out or session expired
				localStorage.removeItem('token')
				document.location.reload()
			}
			return Promise.reject({
				message,
				status: err.response.status,
				xhr: err
			})
		}
	})

	return axios
})()

export const agentAxios = (() => {
	const axios = axiosGlobal.create({
		headers: {
			common: {
				Authorization: localStorage.getItem('agent_token'),
				'Accept-Language': accLang
			}
		}
	})

	axios.interceptors.request.use(request => Promise.resolve(request), requestFailedInterceptor)

	axios.interceptors.response.use(response => {
		return Promise.resolve(response)
	}, err => {
		const message = err.response.data.errors || err.response.data.detail
		if (err.response) {
			if (err.response.status === 401) {
				// User logged out or session expired
				localStorage.removeItem('agent_token')
				document.location.reload()
			}
			return Promise.reject({
				message,
				status: err.response.status,
				xhr: err
			})
		}
	})

	return axios
})()