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
import DeletionModal from '../../modals/DeletionModal'

class TaskbotsPage extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			openDeleteModal: false,
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
			assign_user: bot.assign_user,
			robot_name: bot.robot_name
		}))
		this.setState({loading: true})
		return Promise.all(promises).then(() => {
			this.fetchTaskbots().then(() => {
				this.setState({ loading: false })
			})
		})
	}

	onCloseDeleteModal = () => {
		this.setState({ openDeleteModal: false })
	}

	onDeleteClick = id => {
		this.setState({
			openDeleteModal: true
		})
	}

	render() {
		const { members, match } = this.props
		const { data: taskbots, changes, openDeleteModal } = this.state
		const memberOptions = [
			{
				id: null,
				text: '-- Unassigned --',
				key: '0',
				value: null
			},
			...members.map(member => ({
				id: member.id,
				text: member.username,
				key: member.id,
				value: member.id
			}))
		]
		
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
							<Table.Cell><Dropdown name='assign_user' options={memberOptions} onChange={this.onFormChange.bind(null, bot.id)} selection value={bot.assign_user} placeholder={'Select User'} /></Table.Cell>
							<Table.Cell>
								<Button.Group>
									<NavLink className='ui button' to={`${match.path}/${bot.id}`}><Icon name='file alternate' />Details</NavLink>
								</Button.Group>
							</Table.Cell>
						</Table.Row>
					})}
				</Table.Body>
			</Table>
		</div>
	}
}

const mapStateToProps = (state, props) => ({
	members: state.getIn(['agent', 'members']) || [],
	taskbots: (props.match.params.id ? state.getIn(['agent', 'members', state.getIn(['agent', 'members']).findIndex(m => (m.get('id') + '') === (props.match.params.id + '')) + '', 'bots']) : state.getIn(['agent', 'bots'])) || []
})

export default compose(
	connect(mapStateToProps, { fetchGroups, uploadGroups, trainGroups, fetchTaskbots, fetchMembers, updateTaskbot }),
	toJS
)(TaskbotsPage)