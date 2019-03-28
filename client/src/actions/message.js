import * as types from '../types'
import i18n from '../i18n'

export const setGlobalInfo = message => ({
	type: types.SET_GLOBAL_MESSAGE,
	message_type: 'info',
	message
})

export const setGlobalError = message => ({
	type: types.SET_GLOBAL_MESSAGE,
	message_type: 'error',
	message
})

export const setGlobalSuccess = message => ({
	type: types.SET_GLOBAL_MESSAGE,
	message_type: 'success',
	message
})

export const hideMessage = () => ({
	type: types.SET_GLOBAL_MESSAGE,
	message_type: null
})

export const showNetworkError = () => dispatch =>
	dispatch(setGlobalError(i18n.t('errors.global.network')))

export const showBotError = () => dispatch =>
	dispatch(setGlobalError(i18n.t('errors.global.bot_not_found')))

export const showInfo = message => dispatch => dispatch(setGlobalInfo(message))

export const showSuccess = message => dispatch => dispatch(setGlobalSuccess(message))

export const showError = message => dispatch => dispatch(setGlobalError(message))

export const hideAllMessages = () => dispatch =>
	dispatch(hideMessage())

// For direct use in other actions
export const showNetworkErrorRaw = dispatch =>
	dispatch(setGlobalError(i18n.t('errors.global.network')))

export const showBotErrorRaw = dispatch =>
	dispatch(setGlobalError(i18n.t('errors.global.bot_not_found')))

export const showErrorRaw = (message, dispatch) =>
	dispatch(setGlobalError(message))

export const showSuccessRaw = (message, dispatch) =>
	dispatch(setGlobalSuccess(message))