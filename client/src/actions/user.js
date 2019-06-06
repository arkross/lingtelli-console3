import { FETCH_USER_INFO, FETCH_USER_PACKAGES, FETCH_USER_DETAIL, UPDATE_USER_DETAIL, RESET_USER_PASSWORD, FETCH_TEMPLATE, FETCH_TEMPLATES, FETCH_TEMPLATE_FIELDS } from '../types'
import api from '../apis/user'

const fetchUserInfo = info => ({
	type: FETCH_USER_INFO,
	info,
})

const fetchUserDetail = detail => ({
	type: FETCH_USER_DETAIL,
	detail
})

const updateUserDetail = detail => ({
	type: UPDATE_USER_DETAIL,
	detail
})

const resetUserPassword = data => ({
	type: RESET_USER_PASSWORD,
	data
})

const fetchUserPackage = packages => ({
	type: FETCH_USER_PACKAGES,
	packages,
})

const actionFetchTemplates = data =>({
	type: FETCH_TEMPLATES,
	data
})

const actionFetchTemplate = (templateId, data) => ({
	type: FETCH_TEMPLATE,
	templateId,
	data
})

const actionFetchFields = (templateId, data) => ({
	type: FETCH_TEMPLATE_FIELDS,
	templateId,
	data
})

export const fetchUser = () => dispatch =>
	api.info().then(info => dispatch(fetchUserInfo(info[0])))

export const fetchDetail = () => dispatch =>
	api.getId()
		.then(idResponse =>
			api.detail(idResponse[0].id)
				.then(data => dispatch(fetchUserDetail(data)))
		)

export const updateUser = data => dispatch =>
	api.getId()
		.then(idResponse =>
			api.edit(idResponse[0].id, data)
				.then(response => dispatch(updateUserDetail(response))))

export const resetPassword = data => dispatch =>
	api.getId()
		.then(idResponse =>
			api.resetPassword(idResponse[0].id, data)
				.then(response => 
					dispatch(resetUserPassword(response)))
		)
  

export const fetchPackages = () => dispatch =>
	api.packages().then(packages => dispatch(fetchUserPackage(packages)))

export const fetchTemplates = () => dispatch =>
	api.getTemplates().then(data => dispatch(actionFetchTemplates(data)))

export const fetchTemplate = id => dispatch =>
	api.getTemplate(id).then(data => dispatch(actionFetchTemplate(id, data)))

export const fetchAllTemplateDetails = () => async dispatch => {
	const templates = await api.getTemplates()
	dispatch(actionFetchTemplates(templates))
	templates.forEach(async template => {
		const templateDetail = await api.getTemplate(template.id)
		return dispatch(actionFetchTemplate(template.id, templateDetail))
	})
	return templates
}

export const fetchTemplateFields = id => dispatch =>
  api.getFields(id).then(data => dispatch(actionFetchFields(id, data)))

export const updatePackage = (id, data) => dispatch =>
	api.updatePackage(id, data).then(result => result)

export const createPackage = data => dispatch =>
	api.createPackage(data).then(result => result)

export const deletePackage = id => dispatch =>
	api.deletePackage(id).then(result => result)