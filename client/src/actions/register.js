import { USER_REGISTED } from '../types'
import api from '../apis/auth'

// action function
export const userRegistered = user => ({
	type: USER_REGISTED,
	user,
})
// a register function return a function(action)
export const register = credentials => dispatch =>
	api.register(credentials).then(user => dispatch(userRegistered(user)))
