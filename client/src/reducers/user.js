import * as types from '../types'
import { fromJS } from 'immutable'

const initState = fromJS({
	info: {},
	access_token: '',
	agent_token: '',
	kickMessage: '',
	showLoggedOut: false,
	promptKick: false,
	packages: []
})

export default function user(state = initState, action = {}) {
	switch (action.type) {
	case types.USER_LOGGED_IN:
		return state.withMutations(s => s
			.set('access_token', action.auth.access_token || '')
			.set('kickMessage', action.warning)
			.set('showLoggedOut', false)
			.set('promptKick', action.promptKick || false)
		)
	case types.USER_KICKED:
		return state.set('showLoggedOut', true)
	case types.USER_LOGGED_OUT:
		return state
	case types.USER_REGISTED:
		return state
	case types.USER_CANCEL_LOGIN:
		return state.set('promptKick', false)
	case types.FETCH_USER_INFO:
		return state.set('info', fromJS(action.info))
	case types.FETCH_USER_DETAIL:
		return state.withMutations(s => s
			.set('id', action.detail.id)
			.set('username', action.detail.username)
			.set('first_name', action.detail.first_name)
			.set('language', action.detail.language)
			.set('paid_type', action.detail.paid_type)
			.set('start_date', action.detail.start_date)
			.set('expire_date', action.detail.expire_date)
		)
		// return { ... state, ...action.detail}
	case types.FETCH_USER_PACKAGES:
		return state.set('packages', fromJS(action.packages))
	case types.AGENT_LOGGED_IN:
		return state.withMutations(s => s
			.set('agent_token', action.auth)
			.set('kickMessage', action.warning)
			.set('showLoggedOut', false)
			.set('promptKick', action.promptKick || false))
	case types.AGENT_LOGGED_OUT:
		return state.set('agent_token', '')
	default:
		return state
	}
}
