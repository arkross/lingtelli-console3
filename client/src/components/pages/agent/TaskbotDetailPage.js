import React from 'react'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import _ from 'lodash'
import Dropzone from "react-dropzone"
import { fetchGroups, uploadGroups, trainGroups } from "actions/group"
import { Button, Icon, Form, Input, Grid, Message } from 'semantic-ui-react'
import FileDownload from "react-file-download"
import groupApis from "apis/group"
import { updateTaskbot, fetchTaskbots, deleteTaskbot } from '../../../actions/taskbot'
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
				robot_name: '',
				greeting_msg: '',
				failed_msg: '',
				postback_title: ''
			}
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
				this.setState( { data: this.props.bot, loading: false })
			}
		})
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
					this.setState({ success: 'Import FAQ Successful', errors: null })
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

	render() {
		const { data, errors, success, openDeleteModal } = this.state
		const { t } = this.props
		return <Grid>
				<Grid.Row columns={1}>
					<Grid.Column>
						{errors && <Message error={!!errors} header={errors} />}
						{success && <Message success={!!success} header={success} />}
					</Grid.Column>
				</Grid.Row>
				<Grid.Row divided>
					<Grid.Column width={10}>
						<Form>
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
							<Button onClick={this.onSubmit} content='Update Taskbot' icon={'save'} primary />
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
					<Grid.Column width={6}>
						<Dropzone
							onDrop={this.onDrop.bind(null, data.id)}
							style={{ display: 'none' }}
							ref={(node) => { this.dropzoneRef = node }}
						>
						</Dropzone>
						<Button onClick={() => this.dropzoneRef.open()} color='orange' icon><Icon name='download' /> Import FAQ</Button>
						<Button onClick={this.onExport.bind(null, data.id)} color='violet' icon><Icon name='upload' /> Export FAQ</Button>
						<Button color='brown' onClick={this.onTrain.bind(null, data.id)} icon><Icon name='flask' /> Train Model</Button>
					</Grid.Column>
				</Grid.Row>
			</Grid>
	}
}

const mapStateToProps = (state, props) => ({
	bot: state.getIn(['agent', 'bots']).find(el => (el.get('id') + '') === (props.match.params.id + ''))
})

export default compose(
	connect(mapStateToProps, { updateTaskbot, fetchTaskbots, trainGroups, fetchGroups, uploadGroups, deleteTaskbot }),
	translate(),
	toJS
)(TaskbotDetailPage)