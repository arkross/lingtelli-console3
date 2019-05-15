import React from 'react'
import ReactDOM from 'react-dom'
import 'semantic-ui-css/semantic.min.css'
import './i18n'
import thunk from 'redux-thunk'

import { Provider } from 'react-redux'
import { userLoggedIn } from './actions/auth'
import { agentLoggedIn } from './actions/agent'
import { createStore, applyMiddleware } from 'redux'
import { BrowserRouter, Route } from 'react-router-dom'
import { composeWithDevTools } from 'redux-devtools-extension'
import axios from 'axios'
import { showNetworkErrorRaw, showErrorRaw } from 'actions/message'
import { showKickedOut } from 'actions/auth'

import App from './App'
//import registerServiceWorker from './registerServiceWorker';
import { unregister } from './registerServiceWorker'
import rootReducer from './rootReducer'
import setAuthorizationHeader from './utils/setAuthorizationHeader'

let store = null

if (process.env.NODE_ENV==='development') {
	store = createStore(
		rootReducer,
		composeWithDevTools(applyMiddleware(thunk))
	)
} else {
	store = createStore(
		rootReducer,
		applyMiddleware(thunk)
	)
}

const token = localStorage.getItem('token')
const agent_token = localStorage.getItem('agent_token')

if (token) {
	const user = { access_token: token }
	// reset the token header
	setAuthorizationHeader(token)
	store.dispatch(userLoggedIn(user))
} else if (agent_token) {
	const agent = { success: agent_token }
	setAuthorizationHeader(agent_token)
	store.dispatch(agentLoggedIn(agent))
}

axios.interceptors.request.use(request => {
	let accLang = 'en-us'
	switch (localStorage.i18nextLng) {
		case 'zh-TW': accLang = 'zh-hant'; break;
		case 'zh-CN': accLang = 'zh-hans'; break;
	}
	request.headers['Accept-Language'] = accLang
	return Promise.resolve(request)
}, err => {
	showNetworkErrorRaw(store.dispatch)
	return Promise.reject({
		message: err.request.statusText,
		status: err.request.status,
		xhr: err
	})
})

axios.interceptors.response.use(response => {
	return Promise.resolve(response)
}, err => {
	if (err.response) {
		const message = err.response.data.errors || err.response.data.detail
		if (err.response.status === 401) {
			// User logged out or session expired
			localStorage.removeItem('token')
			localStorage.removeItem('agent_token')
			setAuthorizationHeader()
			showKickedOut(store.dispatch)
		} else {
			showErrorRaw(message, store.dispatch)
		}
		return Promise.reject({
			message,
			status: err.response.status,
			xhr: err
		})
	}
	showNetworkErrorRaw(store.dispatch)
	return Promise.reject({
		message: err.request.statusText,
		status: err.request.status,
		xhr: err
	})
})

ReactDOM.render(
	<BrowserRouter>
		<Provider store={store}>
			<Route component={App} />
		</Provider>
	</BrowserRouter>,
	document.getElementById('root')
)

//registerServiceWorker();
unregister()