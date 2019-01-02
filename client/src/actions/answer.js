import * as types from '../types'
import api from '../apis/answer'

export const update = () => ({
	type: types.UPDATE_ANSWER,
})

export const deleted = () => ({
	type: types.DELETE_ANSWER,
})

export const create = data => ({
	type: types.CREATE_ANSWER,
	data
})

export const updateAnswer = (activeBot, payload) => dispatch =>
	api.update(activeBot, {
		id: payload.id,
		content: payload.content,
	}).then(() => dispatch(update()))

export const deleteAnswer = (activeBot, id) => dispatch =>
	api.delete(activeBot, id).then(() => dispatch(deleted()))

export const createAnswer = (activeBot, id) => dispatch =>
	api.create(activeBot, id).then(() => dispatch(update()))