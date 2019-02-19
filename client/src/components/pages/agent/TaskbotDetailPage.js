import React, {Fragment} from 'react'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import _ from 'lodash'
import Dropzone from "react-dropzone"
import { fetchGroups, uploadGroups, trainGroups } from "actions/group"
import { Button, Icon, Form, Input, Grid, Message, Header, Pagination, Table } from 'semantic-ui-react'
import FileDownload from "react-file-download"
import groupApis from "apis/group"
import { updateTaskbot, fetchTaskbots, deleteTaskbot } from '../../../actions/taskbot'
import { updateQuestion } from '../../../actions/question'
import { updateAnswer } from '../../../actions/answer'
import toJS from 'components/utils/ToJS'
import { translate, Trans } from 'react-i18next'
import DeletionModal from '../../modals/TaskbotDeletionModal'

class TaskbotDetailPage extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			loading: true,
			errors: '',
			success: '',
			openDeleteModal: false,
			data: props.bot || {
				vendor_id: '',
				robot_name: '',
				greeting_msg: '',
				failed_msg: '',
				postback_title: ''
			},
			faq: [],
			activePage: 1
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
				this.props.fetchGroups(this.props.bot.id, '').then(() => {
					this.setState( { data: this.props.bot, loading: false, faq: this.props.groups })
				}).catch(err => {
					this.setState({ data: this.props.bot, loading: false, faq: []})
				})
			}
		})
	}

	componentDidUpdate() {

	}

	onFormChange = (e, {name, value}) => {
		const clone = _.cloneDeep(this.state.data)
		this.setState({ data: _.set(clone, [name], value)})
	}

	onExport = (id, e) => {
		groupApis.export(id)
			.then(data => FileDownload(data, 'export.csv'))
			.catch(() => this.setState({ errors: 'Export FAQ Error' }));
	}

	onDrop = (id, acceptedFiles, rejectedFiles) => {
		const { t, uploadGroups } = this.props

		if (acceptedFiles.length) {
			const files = new FormData()
			files.append('file', acceptedFiles[0])

			this.setState({ loading: true })

			uploadGroups(id, files)
				.then(() => {
					return this.props.fetchGroups(this.props.bot.id, '').then(() => {
						this.setState({ success: 'Import FAQ Successful', errors: null, faq: this.props.groups })
					})
				})
				.catch( res =>
					this.setState({ loading: false , success: null, errors: 'Import FAQ Error' })
				)
		}
	}

	onTrain = id => {
		const { t, trainGroups } = this.props

		this.setState({ loading: true })

		trainGroups(id)
			.then(() => this.setState({ loading: false, success: 'Training Successful' }))
			.catch(() => this.setState({ loading: false, errors: 'Training Failed' }))
	}

	onSubmit = e => {
		this.setState({ loading: true })
		this.props.updateTaskbot(this.props.match.params.id, this.state.data).then(() => {
			this.setState({ loading: false })
			this.props.history.push('/agent/taskbots')
		})
	}

	onDelete = () => {
		const { bot, history } = this.props
		this.props.deleteTaskbot(bot.id).then(() => {
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
		groupApis.create(data.id).then(() => {

		})
	}

	onPageChanged = (e, { activePage }) => {
		this.setState({ activePage })
	}

	onAddQuestionClick = () => {

	}

	onCellInputChange = (type, id, e, { groupId, value }) => {
		const localIndex = _.findIndex(this.state.faq, el => el.group === groupId)
		const groupObj = _.find(this.state.faq, el => el.group === groupId)
		const localSubIndex = _.findIndex(groupObj[type], el => el.id === id)
		this.setState({ 'faq': _.set(_.cloneDeep(this.state.faq), [localIndex, type, localSubIndex, 'content'], value) })
	}

	onCellBlur = (type, id, groupId, e) => {
		const localIndex = _.findIndex(this.state.faq, el => el.group === groupId)
		const groupObj = _.find(this.state.faq, el => el.group === groupId)
		const localSubIndex = _.findIndex(groupObj[type], el => el.id === id)
		this.setState({ 'faq': _.set(_.cloneDeep(this.state.faq), [localIndex, type, localSubIndex, 'loading'], true) })
		const item = _.find(groupObj[type], el => el.id === id)
		if (type === 'question') {
			this.props.updateQuestion(this.props.bot.id, {
				id,
				content: item.content
			}).then(() => {
				this.setState({ 'faq': _.set(_.cloneDeep(this.state.faq), [localIndex, type, localSubIndex, 'loading'], false) })
			})
		} else if (type === 'answer') {
			this.props.updateAnswer(this.props.bot.id, {
				id,
				content: item.content
			}).then(() => {
				this.setState({ 'faq': _.set(_.cloneDeep(this.state.faq), [localIndex, type, localSubIndex, 'loading'], true) })
			})
		}
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
		const { data, errors, success, openDeleteModal, faq, activePage } = this.state
		const { t } = this.props

		const perPage = 10
		const totalPages = Math.ceil(faq.length / perPage)
		const startNumber = perPage * (activePage - 1)
		const displayGroups = _.slice(faq, startNumber, startNumber + perPage + 1)

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
								label='Vendor ID (read only)'
								control={Input}
								
								value={data.vendor_id}
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
						<Button onClick={() => this.dropzoneRef.open()} color='orange' icon><Icon name='download' /> Import</Button>
						<Button onClick={this.onExport.bind(null, data.id)} color='violet' icon><Icon name='upload' /> Export</Button>
						<Button color='brown' onClick={this.onTrain.bind(null, data.id)} icon><Icon name='flask' /> Train</Button>
					</Grid.Column>
					<Grid.Column>
						{totalPages > 0 && <Pagination
							firstItem={{ content: <Icon name='angle double left' />, icon: true }}
							lastItem={{ content: <Icon name='angle double right' />, icon: true }}
							prevItem={{ content: <Icon name='angle left' />, icon: true }}
							nextItem={{ content: <Icon name='angle right' />, icon: true }}
							ellipsisItem={{ content: <Icon name='ellipsis horizontal' />, icon: true }}
							activePage={activePage}
							onPageChange={this.onPageChanged}
							totalPages={totalPages}
						/>}
					</Grid.Column>
				</Grid.Row>
				<Grid.Row columns={1}>
					<Grid.Column>
					{displayGroups && displayGroups.length && 
						<Table celled structured>
							<Table.Header>
								<Table.Row>
									<Table.HeaderCell style={{width: '2rem'}}>ID</Table.HeaderCell>
									<Table.HeaderCell>Question</Table.HeaderCell>
									<Table.HeaderCell>Answer</Table.HeaderCell>
								</Table.Row>
							</Table.Header>
							
							<Table.Body>{ displayGroups.map(item =>
								<Table.Row key={item.group}>
									<Table.Cell>{item.group}</Table.Cell>
									<Table.Cell>
									{item.question && item.question.length && item.question.map(que => 
										<Fragment key={que.id}>
											<Input
												fluid
												loading={item.loading}
												groupId={item.group}
												onChange={this.onCellInputChange.bind(null, 'question', que.id)}
												onBlur={this.onCellBlur.bind(null, 'question', que.id, item.group)}
												value={que.content}
											/>
											<br />
										</Fragment>) }
									</Table.Cell>
									<Table.Cell>
									{item.answer && item.answer.length && item.answer.map(ans => 
										<Fragment key={ans.id}>
											<Input
												fluid
												loading={item.loading}
												groupId={item.group}
												onChange={this.onCellInputChange.bind(null, 'answer', ans.id)}
												onBlur={this.onCellBlur.bind(null, 'answer', ans.id, item.group)}
												value={ans.content}
											/>
											<br />
										</Fragment>) }
									</Table.Cell>
								</Table.Row>
							)}</Table.Body>
						</Table>}
					</Grid.Column>
				</Grid.Row>
				<Grid.Row columns={2}>
					<Grid.Column></Grid.Column>
					<Grid.Column>
						{totalPages > 0 && <Pagination
							firstItem={{ content: <Icon name='angle double left' />, icon: true }}
							lastItem={{ content: <Icon name='angle double right' />, icon: true }}
							prevItem={{ content: <Icon name='angle left' />, icon: true }}
							nextItem={{ content: <Icon name='angle right' />, icon: true }}
							ellipsisItem={{ content: <Icon name='ellipsis horizontal' />, icon: true }}
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
	bot: state.getIn(['agent', 'bots']).find(el => (el.get('id') + '') === (props.match.params.id + '')),
	groups: state.getIn(['bot', 'bots', props.match.params.id, 'group', 'groups']),
})

export default compose(
	connect(mapStateToProps, {
		updateTaskbot,
		fetchTaskbots,
		trainGroups,
		fetchGroups,
		uploadGroups,
		deleteTaskbot,
		updateQuestion,
		updateAnswer
	}),
	translate(),
	toJS
)(TaskbotDetailPage)