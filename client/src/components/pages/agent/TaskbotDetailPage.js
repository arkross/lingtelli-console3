import React from 'react'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import _ from 'lodash'
import Dropzone from "react-dropzone"
import { fetchGroups, uploadGroups, trainGroups } from "actions/group"
import { Button, Icon, Form, Input } from 'semantic-ui-react'
import FileDownload from "react-file-download"
import groupApis from "apis/group"
import { updateTaskbot, fetchTaskbots } from '../../../actions/taskbot'
import toJS from 'components/utils/ToJS'

class TaskbotDetailPage extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			loading: true,
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

	onSubmit = e => {
		this.setState({ loading: true })
		this.props.updateTaskbot(this.props.match.params.id, this.state.data).then(() => {
			this.setState({ loading: false })
			this.props.history.push('/agent/taskbots')
		})
	}

	render() {
		const { data } = this.state
		return <Form>
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
		</Form>
	}
}

const mapStateToProps = (state, props) => ({
	bot: state.getIn(['agent', 'bots']).find(el => (el.get('id') + '') === (props.match.params.id + ''))
})

export default compose(
	connect(mapStateToProps, { updateTaskbot, fetchTaskbots }),
	toJS
)(TaskbotDetailPage)