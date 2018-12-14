import { combineReducers } from 'redux-immutable'

import user from 'reducers/user'
import bot from 'reducers/bot'
import group from 'reducers/group'
import messages from 'reducers/message'

export default combineReducers({
	user,
	bot,
	group,
	messages
})
