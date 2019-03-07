import React, {Fragment} from 'react'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import _ from 'lodash'
import Dropzone from "react-dropzone"
import { fetchGroups, uploadGroups, trainGroups } from "../../../actions/group"
import { Button, Icon, Form, Input, Grid, Message, Header, Pagination, Table, Divider } from 'semantic-ui-react'
import FileDownload from "react-file-download"
import groupApis from "apis/group"
import { deleteGroup } from '../../../actions/group'
import { updateTaskbot, fetchTaskbots, deleteTaskbot } from '../../../actions/taskbot'
import { createQuestion, updateQuestion, deleteQuestion } from '../../../actions/question'
import { updateAnswer, createAnswer } from '../../../actions/answer'
import toJS from 'components/utils/ToJS'
import { translate, Trans } from 'react-i18next'
import DeletionModal from '../../modals/TaskbotDeletionModal'
import LingPagination from '../../utils/LingPagination'
import qs from 'query-string'
import TestBotPage from '../TestBotPage'

class TaskbotDetailPage extends React.Component {

	constructor(props) {
		super(props)
		const params = props.location ? qs.parse(props.location.search) : {page: 1}
		this.state = {
			loading: true,
			errors: '',
			success: '',
			openDeleteModal: false,
			addGroupLoading: false,
			trainLoading: false,
			importLoading: false,
			exportLoading: false,
			data: props.bot || {
				vendor_id: '',
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
		this.fetchTaskbots()
	}

	fetchTaskbots = () => {
		return this.props.fetchTaskbots().then(() => {
			if ( ! this.props.bot) {
				this.props.history.push('/agent/taskbots')
			} else {
				this.fetchGroups()
			}
		})
	}

	fetchGroups = (activePage = null) => {
		return this.props.fetchGroups(this.props.bot.id, activePage || this.state.activePage, '').then(() => {
			this.setState( { data: this.props.bot, loading: false, faq: this.props.groups })
		}, err => {
			this.setState({ data: this.props.bot, loading: false, faq: []})
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
		groupApis.export(id)
			.then(data => FileDownload(data, 'export.csv'),
			() => this.setState({ errors: 'Export FAQ Error' }))
			.finally(() => this.setState({ exportLoading: false }));
	}

	onDrop = (id, acceptedFiles, rejectedFiles) => {
		const { t, uploadGroups } = this.props

		if (acceptedFiles.length) {
			const files = new FormData()
			files.append('file', acceptedFiles[0])

			this.setState({ importLoading: true })

			return uploadGroups(id, files)
				.then(() => {
					this.props.trainGroups(this.props.bot.id)
					return this.props.fetchGroups(this.props.bot.id, this.state.activePage, '').then(() => {
						this.setState({ success: 'Import FAQ Successful', errors: null, faq: this.props.groups, importLoading: false })
					})
				})
				.catch( res =>
					this.setState({ importLoading: false , success: null, errors: 'Import FAQ Error' })
				)
		}
	}

	onTrain = id => {
		const { t, trainGroups } = this.props

		this.setState({ trainLoading: true })

		return trainGroups(id)
			.then(() => this.setState({ trainLoading: false, success: 'Training Successful' }))
			.catch(() => this.setState({ trainLoading: false, errors: 'Training Failed' }))
	}

	onSubmit = e => {
		this.setState({ loading: true })
		return this.props.updateTaskbot(this.props.match.params.id, this.state.data).then(() => {
			this.setState({ loading: false })
			this.props.history.push('/agent/taskbots')
		})
	}

	onDelete = () => {
		const { bot, history } = this.props
		return this.props.deleteTaskbot(bot.id).then(() => {
			history.push('/agent/taskbots')
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
		return groupApis.create(data.id).then(result => {
			return this.props.createAnswer(this.props.bot.id, result.id).then(() => {
				return this.props.createQuestion(this.props.bot.id, result.id).then(() => {
					return this.fetchGroups().then(() => {
						this.setState({ addGroupLoading: false })
					})
				})
			})
		})
	}

	onPageChanged = (e, { activePage }) => {
		this.setState({ activePage })
		this.fetchGroups(activePage)
	}

	onDeleteGroup = (groupId, e) => {
		const localIndex = _.findIndex(this.state.faq, el => el.group === groupId)
		this.setState({
			faq: _.set(_.cloneDeep(this.state.faq), [localIndex, 'deleteLoading'], true)
		})
		return this.props.deleteGroup(this.props.bot.id, groupId).then(() => {
			return this.fetchGroups()
		}, err => {
			this.setState({
				faq: _.set(_.cloneDeep(this.state.faq), [localIndex, 'deleteLoading'], false)
			})
		})
	}

	onAddQuestionClick = (groupId, e) => {
		return this.props.createQuestion(this.props.bot.id, groupId).then(() => this.fetchGroups())
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
				promise = this.props.createQuestion(this.props.bot.id, groupId, newContent)
			}
			else if (type === 'answer') {
				promise = this.props.createAnswer(this.props.bot.id, groupId, newContent)
			}
			return promise.then(() => {
				return this.fetchGroups()
			}, err => {
				this.setState({
					faq: _.set(_.cloneDeep(this.stat.faq), [localIndex, 'newState', type], 'error')
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
				promise = this.props.updateQuestion(this.props.bot.id, {
					id,
					content: item.content
				})
			} else {
				promise = this.props.deleteQuestion(this.props.bot.id, id)
			}
		} else if (type === 'answer') {
			promise = this.props.updateAnswer(this.props.bot.id, {
					id,
					content: item.content
			})
		}
		return promise.then(() => {
			this.setState({ faq: _.set(_.cloneDeep(this.state.faq), [localIndex, type, localSubIndex, 'state'], 'success') })
		}, err => {
			this.setState({ faq: _.set(_.cloneDeep(this.state.faq), [localIndex, type, localSubIndex, 'state'], 'error') })
		}).finally(() => {
			return this.fetchGroups()
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
			trainLoading,
			importLoading,
			exportLoading
		} = this.state
		const { t, bot, group, location, history } = this.props

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
					<Form>
						<Form.Field
							id='vendor_id'
							name='vendor_id'
							label='Vendor ID'
							control={Input}
							transparent
							value={data.vendor_id || '(empty)'}
							onClick={this.onVendorClick}
							readOnly />
						<Form.Field
							id='robot_name'
							name='robot_name'
							label='Bot Name'
							control={Input}
							value={data.robot_name}
							onChange={this.onFormChange} />
						<Form.Field
							id='greeting_msg'
							name='greeting_msg'
							label='Greeting Message'
							control={Input}
							value={data.greeting_msg}
							onChange={this.onFormChange} />
						<Form.Field
							id='failed_msg'
							name='failed_msg'
							label='Failed Message'
							control={Input}
							value={data.failed_msg}
							onChange={this.onFormChange} />
						<Form.Field
							id='postback_title'
							name='postback_title'
							label='Postback Title'
							control={Input}
							value={data.postback_title}
							onChange={this.onFormChange} />
						<Button onClick={this.onSubmit} content='Update' icon={'save'} primary />
						<Button onClick={this.onOpenDeleteModal} negative icon='trash' content='Delete' />
						<DeletionModal
							title={t('chatbot.delete.title')}
							open={openDeleteModal}
							onClose={this.onCloseDeleteModal}
							onSuccess={this.onDelete}
							message={<Trans i18nKey='chatbot.delete.warning'><strong>{data.robot_name}</strong></Trans>}
							buttonText={t('chatbot.delete.title')}
							botId={data.id}
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
					<Button loading={trainLoading} color='brown' onClick={this.onTrain.bind(null, data.id)} icon><Icon name='flask' /> Train</Button>
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
			<Grid.Row>
				<Grid.Column>
					<Divider />
					<TestBotPage info={bot} cancelAutoFocus={true} />
				</Grid.Column>
			</Grid.Row>
		</Grid>
	}
}

const mapStateToProps = (state, props) => ({
	bot: state.getIn(['agent', 'bots']).find(el => (el.get('id') + '') === (props.match.params.id + '')) || {},
	groups: state.getIn(['bot', 'bots', props.match.params.id, 'group', 'results']),
	group: state.getIn(['bot', 'bots', props.match.params.id, 'group'])
})

export default compose(
	connect(mapStateToProps, {
		updateTaskbot,
		fetchTaskbots,
		trainGroups,
		fetchGroups,
		uploadGroups,
		deleteTaskbot,
		createQuestion,
		updateQuestion,
		deleteQuestion,
		deleteGroup,
		createAnswer,
		updateAnswer
	}),
	translate(),
	toJS
)(TaskbotDetailPage)