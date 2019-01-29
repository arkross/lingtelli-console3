import * as types from '../types'
import api from '../apis/question'

export const create = data => ({
	type: types.CREATE_QUESTION,
	data
})

export const update = data => ({
	type: types.UPDATE_QUESTION,
	data,
})

export const deleted = () => ({
	type: types.DELETE_QUESTION,
})

export const createQuestion = (activeBot, gid) => dispatch =>
	api.create(activeBot, gid).then(() => dispatch(update()))

export const updateQuestion = (activeBot, { id, content }) => dispatch =>
	api.update(activeBot, { id, content }).then(data => dispatch(update(data)))

export const deleteQuestion = (activeBot, id) => dispatch =>
	api.delete(activeBot, id).then(() => dispatch(deleted()))
