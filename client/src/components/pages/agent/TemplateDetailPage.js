import React, {Fragment} from 'react'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import _ from 'lodash'
import Dropzone from "react-dropzone"
import { Button, Icon, Form, Input, Grid, Message, Header, Pagination, Table, Divider, Label, Modal, List } from 'semantic-ui-react'
import FileDownload from "react-file-download"
import {
	fetchTemplates,
	fetchTemplate,
	updateTemplate,
	deleteTemplate,
	fetchTemplateFAQGroups,
	fetchTemplateFAQGroup,
	createTemplateFAQGroup,
	createTemplateAnswer,
	createTemplateQuestion,
	updateTemplateAnswer,
	updateTemplateQuestion,
	deleteTemplateAnswer,
	deleteTemplateQuestion,
	deleteTemplateFAQGroup,
	exportFAQ,
	uploadFAQ
} from '../../../actions/template'
import toJS from 'components/utils/ToJS'
import { translate, Trans } from 'react-i18next'
import DeletionModal from '../../modals/TaskbotDeletionModal'
import LingPagination from '../../utils/LingPagination'
import qs from 'query-string'

class TemplateDetailPage extends React.Component {

	constructor(props) {
		super(props)
		const params = props.location ? qs.parse(props.location.search) : {page: 1}
		this.state = {
			loading: true,
			errors: '',
			success: '',
			openDeleteModal: false,
			addGroupLoading: false,
			importLoading: false,
			exportLoading: false,
			data: props.template || {
				robot_name: '',
				greeting_msg: '',
				failed_msg: '',
				postback_title: ''
			},
			faq: [],
			activePage: params.page
		}
	}

	componentDidMount() {
		this.fetchTemplates()
	}

	fetchTemplates = () => {
		return this.props.fetchTemplate(this.props.match.params.id).then(() => {
			if ( ! this.props.template) {
				this.props.history.push('/agent/templates')
			} else {
				this.fetchTemplateFAQGroups()
			}
		})
	}

	fetchTemplateFAQGroups = (activePage = null) => {
		
		return this.props.fetchTemplateFAQGroups(this.props.template.id, activePage || this.state.activePage, '').then(() => {
			const { template: { group }} = this.props
			const groups = (group && group.results) ? group.results : []
			this.setState( { data: this.props.template, loading: false, faq: groups })
		}, err => {
			this.setState({ data: this.props.template, loading: false, faq: []})
		})
	}

	componentDidUpdate() {

	}

	onFormChange = (e, {name, value}) => {
		const clone = _.cloneDeep(this.state.data)
		this.setState({ data: _.set(clone, [name], value)})
	}

	onExport = (id, e) => {
		this.setState({ exportLoading: true })
		this.props.exportFAQ(id)
			.then(data => FileDownload(data, 'export.csv'),
			() => this.setState({ errors: 'Export FAQ Error' }))
			.finally(() => this.setState({ exportLoading: false }));
	}

	onDrop = (id, acceptedFiles, rejectedFiles) => {
		const { t, uploadFAQ, template: { group } } = this.props
		const groups = group && group.results ? group.results : []

		if (acceptedFiles.length) {
			const files = new FormData()
			files.append('file', acceptedFiles[0])

			this.setState({ importLoading: true })

			return uploadFAQ(id, files)
				.then(() => {
					return this.props.fetchTemplateFAQGroups(this.props.template.id, this.state.activePage, '').then(() => {
						this.setState({ success: 'Import FAQ Successful', errors: null, faq: groups, importLoading: false })
					})
				})
				.catch( res =>
					this.setState({ importLoading: false , success: null, errors: 'Import FAQ Error' })
				)
		}
	}

	onSubmit = e => {
		e.preventDefault()
		this.setState({ loading: true })
		return this.props.updateTemplate(this.props.match.params.id, {
			robot_name: this.state.data.robot_name,
			greeting_msg: this.state.data.greeting_msg,
			failed_msg: this.state.data.failed_msg,
			postback_title: this.state.data.postback_title
		}).then(() => {
			this.setState({ loading: false, success: 'Bot updated succesfully' })
			// this.props.history.push('/agent/templates')
		}, err => {
			this.setState({ loading: false, error: 'Failed to update bot'})
		})
	}

	onDelete = () => {
		const { bot, history } = this.props
		return this.props.deleteTemplate(bot.id).then(() => {
			history.push('/agent/templates')
		})
	}

	onOpenDeleteModal = (e) => {
		e.preventDefault()
		this.setState({ openDeleteModal: true })
	}

	onCloseDeleteModal = () => {
		this.setState({ openDeleteModal: false })
	}

	onVendorClick = (e) => {
		const el = e.target
		el.setSelectionRange(0, el.value.length)
	}

	onAddGroupClick = () => {
		const { data } = this.state
		this.setState({ addGroupLoading: true })
		return this.props.createTemplateFAQGroup(data.id).then(result => {
			return this.props.createTemplateAnswer(this.props.template.id, result.id, ' ').then(() => {
				return this.props.createTemplateQuestion(this.props.template.id, result.id, ' ').then(() => {
					return this.fetchTemplateFAQGroups().then(() => {
						this.setState({ addGroupLoading: false })
					})
				})
			})
		})
	}

	onPageChanged = (e, { activePage }) => {
		this.setState({ activePage })
		this.fetchTemplateFAQGroups(activePage)
	}

	onConfirmDelete = e => {
		this.props.deleteTemplate(this.props.match.params.id).then(() => {
			this.props.history.push('/agent/templates')
		})
	}

	onDeleteGroup = (groupId, e) => {
		const localIndex = _.findIndex(this.state.faq, el => el.group === groupId)
		this.setState({
			faq: _.set(_.cloneDeep(this.state.faq), [localIndex, 'deleteLoading'], true)
		})
		return this.props.deleteTemplateFAQGroup(this.props.template.id, groupId).then(() => {
			return this.fetchTemplateFAQGroups()
		}, err => {
			this.setState({
				faq: _.set(_.cloneDeep(this.state.faq), [localIndex, 'deleteLoading'], false)
			})
		})
	}

	onAddQuestionClick = (groupId, e) => {
		return this.props.createTemplateQuestion(this.props.template.id, groupId).then(() => this.fetchTemplateFAQGroups())
	}

	onCellInputChange = (type, id, e, { groupid, value }) => {
		const localIndex = _.findIndex(this.state.faq, el => el.group === groupid)
		const groupObj = _.find(this.state.faq, el => el.group === groupid)
		const localSubIndex = _.findIndex(groupObj[type], el => el.id === id)
		this.setState({ faq: _.set(_.cloneDeep(this.state.faq), [localIndex, type, localSubIndex, 'content'], value) })
	}

	onNewCellKeyDown = (type, groupId, e) => {
		if (e.keyCode == 13) {
			let promise = new Promise(() => {})
			const localIndex = _.findIndex(this.state.faq, el => el.group === groupId)
			const groupObj = _.find(this.state.faq, el => el.group === groupId)
			const newContent = groupObj.newContent ? (groupObj.newContent[type] || '') : ''
			if ( ! newContent) {
				return false
			}
			this.setState({
				faq: _.set(_.cloneDeep(this.state.faq), [localIndex, 'newState', type], 'loading')
			})
			if (type === 'question') {
				promise = this.props.createTemplateQuestion(this.props.template.id, groupId, newContent)
			}
			else if (type === 'answer') {
				promise = this.props.createTemplateAnswer(this.props.template.id, groupId, newContent)
			}
			return promise.then(() => {
				return this.fetchTemplateFAQGroups()
			}, err => {
				this.setState({
					faq: _.set(_.cloneDeep(this.state.faq), [localIndex, 'newState', type], 'error')
				})
			})
		}
	}

	onNewCellInputChange = (type, groupId, e, { value }) => {
		const localIndex = _.findIndex(this.state.faq, el => el.group === groupId)
		this.setState({
			faq: _.set(_.cloneDeep(this.state.faq), [localIndex, 'newContent', type], value)
		})
	}

	onCellKeyDown = (type, id, groupId, e) => {
		if (e.keyCode == 13) {
			return this.onCellBlur(type, id, groupId, e)
		}
	}

	onCellBlur = (type, id, groupId, e) => {
		const localIndex = _.findIndex(this.state.faq, el => el.group === groupId)
		const groupObj = _.find(this.state.faq, el => el.group === groupId)
		const localSubIndex = _.findIndex(groupObj[type], el => el.id === id)
		this.setState({ faq: _.set(_.cloneDeep(this.state.faq), [localIndex, type, localSubIndex, 'state'], 'loading') })
		const item = _.find(groupObj[type], el => el.id === id)
		let promise = new Promise(() => {})
		if (type === 'question') {
			if (item.content) {
				promise = this.props.updateTemplateQuestion(this.props.template.id, id, {
					content: item.content
				})
			} else {
				promise = this.props.deleteTemplateQuestion(this.props.template.id, id)
			}
		} else if (type === 'answer') {
			promise = this.props.updateTemplateAnswer(this.props.template.id, id, {
					content: item.content
			})
		}
		return promise.then(() => {
			this.setState({ faq: _.set(_.cloneDeep(this.state.faq), [localIndex, type, localSubIndex, 'state'], 'success') })
		}, err => {
			this.setState({ faq: _.set(_.cloneDeep(this.state.faq), [localIndex, type, localSubIndex, 'state'], 'error') })
		}).finally(() => {
			return this.fetchTemplateFAQGroups()
		})

	}

	onMessageClick = (type) => {
		if (type === 'error') {
			this.setState({ errors: ''})
		}
		else if (type === 'success') {
			this.setState({ success: ''})
		}
	}

	render() {
		const { data, errors, success, openDeleteModal, faq, activePage,
			addGroupLoading,
			importLoading,
			exportLoading
		} = this.state
		const { t, template, template: {group}, location, history } = this.props
		let groups = []
		if (group && group.results) {
			groups = group.results
		}

		const perPage = 10
		const totalPages = Math.ceil((group ? group.count : faq.length) / perPage)
		const displayGroups = faq

		return <Grid>
			<Grid.Row columns={1}>
				<Grid.Column>
					{errors && <Message error={!!errors} header={errors} onClick={this.onMessageClick.bind(null, 'error')} />}
					{success && <Message success={!!success} header={success} onClick={this.onMessageClick.bind(null, 'success')} />}
				</Grid.Column>
			</Grid.Row>
			<Grid.Row divided>
				<Grid.Column>
					<Form onSubmit={this.onSubmit}>
						<Form.Field
							id='robot_name'
							name='robot_name'
							label='Bot Name'
							control={Input}
							value={data.robot_name || ''}
							onChange={this.onFormChange} />
						<Form.Field
							id='greeting_msg'
							name='greeting_msg'
							label='Greeting Message'
							control={Input}
							value={data.greeting_msg || ''}
							onChange={this.onFormChange} />
						<Form.Field
							id='failed_msg'
							name='failed_msg'
							label='Failed Message'
							control={Input}
							value={data.failed_msg || ''}
							onChange={this.onFormChange} />
						<Form.Field
							id='postback_title'
							name='postback_title'
							label='Postback Title'
							control={Input}
							value={data.postback_title || ''}
							onChange={this.onFormChange} />
						<Label><Icon name='language' size='large' />{t(`chatbot.language.${data.language}`)}</Label><br /><br/>
						<Button onClick={this.onSubmit} content='Update' icon={'save'} primary />
						<Button onClick={this.onOpenDeleteModal} negative icon='trash' content='Delete' />
						<Modal
							header='Deleting Template'
							open={openDeleteModal}
							onClose={this.onCloseDeleteModal}
							content='Are you sure you want to delete this template?'
							actions={[
								{
									key: 'confirm',
									onClick: this.onConfirmDelete,
									content: 'OK',
									negative: true
								},
								{
									key: 'cancel',
									onClick: this.onCloseDeleteModal,
									content: 'Cancel'
								}
							]}
						/>
					</Form>
					<Divider />
				</Grid.Column>
			</Grid.Row>
			<Grid.Row columns={2}>
				<Grid.Column>
					<Dropzone
						onDrop={this.onDrop.bind(null, data.id)}
						style={{ display: 'none' }}
						ref={(node) => { this.dropzoneRef = node }}
					>
					</Dropzone>
					<Button loading={importLoading} onClick={() => this.dropzoneRef.open()} color='orange' icon><Icon name='upload' /> Import</Button>
					<Button loading={exportLoading} onClick={this.onExport.bind(null, data.id)} color='violet' icon><Icon name='download' /> Export</Button>
					<Button icon='plus' content='Add Group' onClick={this.onAddGroupClick} color='green' loading={addGroupLoading} />
				</Grid.Column>
				<Grid.Column>
					{totalPages > 0 && <LingPagination
						history={history}
						location={location}
						activePage={activePage}
						onPageChange={this.onPageChanged}
						totalPages={totalPages}
					/>}
				</Grid.Column>
			</Grid.Row>
			<Grid.Row columns={1}>
				<Grid.Column>
					<Message info>
						<Message.Header>Template variable</Message.Header>
						<List bulleted>
							<List.Item>Format: {`{sequence:variableName}`}</List.Item>
							<List.Item>Example: {`{1:公司}, {2:地址}, {3:姓名}`}</List.Item>
							<List.Item>Space characters are <strong>not</strong> allowed.</List.Item>
							<List.Item>Sequence must be a whole number starting from 1.</List.Item>
							<List.Item>If there are multiple different variable names with the same sequence, order will be determined from the appearance in QA list.</List.Item>
						</List>
					</Message>
				</Grid.Column>
			</Grid.Row>
			<Grid.Row columns={1}>
				<Grid.Column>
				{displayGroups && !!displayGroups.length && 
					<Table celled structured>
						<Table.Header>
							<Table.Row>
								<Table.HeaderCell style={{width: '2rem'}}>Group</Table.HeaderCell>
								<Table.HeaderCell>Question</Table.HeaderCell>
								<Table.HeaderCell>Answer</Table.HeaderCell>
								<Table.HeaderCell style={{width: '2rem'}}>Action</Table.HeaderCell>
							</Table.Row>
						</Table.Header>
						
						<Table.Body>{ displayGroups.map(item =>
							<Table.Row key={item.group}>
								<Table.Cell>{item.group}</Table.Cell>
								<Table.Cell>
								{item.question && !!item.question.length && item.question.map(que => 
									<Fragment key={que.id}>
										<Input
											fluid
											loading={que.state === 'loading'}
											error={que.state === 'error'}
											icon={que.state === 'success' ? 'check' : null}
											groupid={item.group}
											onChange={this.onCellInputChange.bind(null, 'question', que.id)}
											onBlur={this.onCellBlur.bind(null, 'question', que.id, item.group)}
											onKeyDown={this.onCellKeyDown.bind(null, 'question', que.id, item.group)}
											value={que.content}
										/>
									</Fragment>) }
									<Input
										loading={item.newState && (item.newState.question === 'loading')}
										error={item.newState && (item.newState.question === 'error')}
										icon='plus'
										placeholder='New Question'
										value={item.newContent ? (item.newContent.question || '') : ''}
										fluid
										onChange={this.onNewCellInputChange.bind(null, 'question', item.group)}
										onKeyDown={this.onNewCellKeyDown.bind(null, 'question', item.group)}
									/>
								</Table.Cell>
								<Table.Cell>
								{item.answer && !!item.answer.length && item.answer.map(ans => 
									<Fragment key={ans.id}>
										<Input
											fluid
											loading={ans.state === 'loading'}
											error={ans.state === 'error'}
											icon={ans.state === 'success' ? 'check' : null}
											groupid={item.group}
											onChange={this.onCellInputChange.bind(null, 'answer', ans.id)}
											onBlur={this.onCellBlur.bind(null, 'answer', ans.id, item.group)}
											onKeyDown={this.onCellKeyDown.bind(null, 'answer', ans.id, item.group)}
											value={ans.content}
										/>
									</Fragment>) }
								</Table.Cell>
								<Table.Cell>
									<Button icon='remove' color='red' onClick={this.onDeleteGroup.bind(null, item.group)} loading={item.deleteLoading} />
								</Table.Cell>
							</Table.Row>
						)}</Table.Body>
					</Table>}
				</Grid.Column>
			</Grid.Row>
			<Grid.Row columns={2}>
				<Grid.Column></Grid.Column>
				<Grid.Column>
					{totalPages > 0 && <LingPagination
						history={history}
						location={location}
						activePage={activePage}
						onPageChange={this.onPageChanged}
						totalPages={totalPages}
					/>}
				</Grid.Column>
			</Grid.Row>
		</Grid>
	}
}

const mapStateToProps = (state, props) => ({
	template: state.get('template').find(el => (el.get('id') + '') === (props.match.params.id + '')) || {}
})

export default compose(
	connect(mapStateToProps, {
		createTemplateFAQGroup,
		updateTemplate,
		fetchTemplate,
		fetchTemplates,
		fetchTemplateFAQGroups,
		uploadFAQ,
		exportFAQ,
		deleteTemplate,
		createTemplateQuestion,
		updateTemplateQuestion,
		deleteTemplateQuestion,
		deleteTemplateFAQGroup,
		createTemplateAnswer,
		updateTemplateAnswer
	}),
	translate(),
	toJS
)(TemplateDetailPage)