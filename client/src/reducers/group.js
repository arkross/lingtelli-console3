import * as types from '../types'
import { fromJS } from 'immutable'

const initState = fromJS({
	groups: [],
	total: ''
})

export default function group(state = initState, action = {}) {
	switch (action.type) {
	case types.UPDATE_QUESTION:
		return state
	case types.DELETE_QUESTION:
		return state
	case types.UPLOAD_GROUPS:
		return state
	default:
		return state
	}
}
