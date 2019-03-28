import { fromJS } from 'immutable'
import * as types from '../types'

const initState = fromJS({
	showing: null,
	message: ''
})

export default function(state = initState, action = {}) {
	switch (action.type) {
	case types.SET_GLOBAL_MESSAGE:
		if (action.message_type) {
			if ( ! action.message) {
				// Must not show empty error message
				return state
			}
		}
		return state.withMutations(s => s
			.set('showing', action.message_type)
			.set('message', action.message)
		)
	default: break
	}
	return state
}