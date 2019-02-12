import React from 'react'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { NavLink } from 'react-router-dom'
import _ from 'lodash'
import Dropzone from "react-dropzone"
import { fetchGroups, uploadGroups, trainGroups } from "actions/group"
import { Button, Icon, Table, Dropdown, Input } from 'semantic-ui-react'
import FileDownload from "react-file-download"
import groupApis from "apis/group"
import { fetchTaskbots, updateTaskbot } from '../../../actions/taskbot'
import { fetchMembers } from '../../../actions/agent'
import toJS from 'components/utils/ToJS'

class TaskbotsPage extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			data: props.taskbots,
			changes: []
		}
	}

	componentDidMount() {
		this.props.fetchMembers()
		this.fetchTaskbots()
	}

	fetchTaskbots = () => {
		return this.props.fetchTaskbots().then(() => {
			this.calculateChanges(this.props.taskbots)
		})
	}

	calculateChanges = (newTaskbots) => {
		const changes = _.filter(newTaskbots, bot => JSON.stringify(this.props.taskbots.find(dbot => dbot.id === bot.id)) !== JSON.stringify(bot))
		this.setState({ data: newTaskbots, changes })
	}

	onFormChange = (id, e, data) => {
		const { name, value } = data
		const index = this.state.data.findIndex(bot => bot.id === id)
		const clone = _.cloneDeep(this.state.data)
		const newData = _.set(clone, [index, name], value)
		this.calculateChanges(newData)
	}

	onSubmit = e => {
		const { data: taskbots, changes } = this.state
		const promises = changes.map(bot => this.props.updateTaskbot(bot.id, {
			user: bot.user,
			robot_name: bot.robot_name
		}))
		this.setState({loading: true})
		return Promise.all(promises).then(() => {
			this.fetchTaskbots().then(() => {
				this.setState({ loading: false })
			})
		})
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

	render() {
		const { members, match } = this.props
		const { data: taskbots, changes } = this.state
		const memberOptions = members.map(member => ({
			id: member.id,
			text: member.username,
			key: member.id,
			value: member.id
		}))
		
		return <div>
			<NavLink to='/agent/taskbots/create' className='ui button green'><Icon name='plus' /> Create</NavLink>
			<Button content='Save Changes' floated='right' primary icon='save' disabled={changes.length === 0} onClick={this.onSubmit} />
			<Table>
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell>Name</Table.HeaderCell>
						<Table.HeaderCell>Assigned to</Table.HeaderCell>
						<Table.HeaderCell>Actions</Table.HeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{taskbots.map(bot => {
						const isChanged = changes.findIndex(c => c.id === bot.id) >= 0
						return <Table.Row key={bot.id} warning={isChanged}>
							<Table.Cell><Input name='robot_name' onChange={this.onFormChange.bind(null, bot.id)} value={bot.robot_name} /></Table.Cell>
							<Table.Cell><Dropdown name='user' options={memberOptions} onChange={this.onFormChange.bind(null, bot.id)} selection value={bot.user} placeholder={'Select User'} /></Table.Cell>
							<Table.Cell>
								<Button.Group size='mini'>
									<NavLink className='ui button' to={`${match.path}/${bot.id}`}><Icon name='file alternate' />Details</NavLink>
									<Button size='mini' onClick={() => this.dropzoneRef.open()} color='orange' icon><Icon name='download' /> Import FAQ</Button>
									<Button size='mini' onClick={this.onExport.bind(null, bot.id)} color='violet' icon><Icon name='upload' /> Export FAQ</Button>
									<Button size='mini' color='brown' icon><Icon name='flask' /> Train Model</Button>
								</Button.Group>
							</Table.Cell>
						</Table.Row>
					})}
				</Table.Body>
			</Table>
			<Dropzone
				onDrop={this.onDrop}
				style={{ display: 'none' }}
				ref={(node) => { this.dropzoneRef = node }}
			>
			</Dropzone>
			
		</div>
	}
}

const mapStateToProps = (state, props) => ({
	members: state.getIn(['agent', 'members']) || [],
	taskbots: (props.match.params.id ? state.getIn(['agent', 'members', props.match.params.id, 'bots']) : state.getIn(['agent', 'bots'])) || []
})

export default compose(
	connect(mapStateToProps, { fetchGroups, uploadGroups, trainGroups, fetchTaskbots, fetchMembers, updateTaskbot }),
	toJS
)(TaskbotsPage)