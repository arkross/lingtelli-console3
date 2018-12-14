import React from 'react'
import ReactDOM from 'react-dom'
import 'semantic-ui-css/semantic.min.css'
import './i18n'
import thunk from 'redux-thunk'

import { Provider } from 'react-redux'
import { userLoggedIn } from './actions/auth'
import { createStore, applyMiddleware } from 'redux'
import { BrowserRouter, Route } from 'react-router-dom'
import { composeWithDevTools } from 'redux-devtools-extension'
import axios from 'axios'
import { showNetworkErrorRaw, showErrorRaw } from 'actions/message'

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

if (token) {
	const user = { access_token: token }
	// reset the token header
	setAuthorizationHeader(token)
	store.dispatch(userLoggedIn(user))
}

axios.interceptors.request.use(request => {
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
		showErrorRaw(message, store.dispatch)
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