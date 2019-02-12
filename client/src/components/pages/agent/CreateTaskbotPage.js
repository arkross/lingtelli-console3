import React from 'react'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import _ from 'lodash'
import Dropzone from "react-dropzone"
import { fetchGroups, uploadGroups, trainGroups } from "actions/group"
import { Button, Icon, Form, Input } from 'semantic-ui-react'
import FileDownload from "react-file-download"
import groupApis from "apis/group"
import { createTaskbot } from '../../../actions/taskbot'
import toJS from 'components/utils/ToJS'

class CreateTaskbotPage extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			loading: false,
			data: {
				robot_name: '',
				greeting_msg: '',
				failed_msg: '',
				postback_title: '',
				language: 'tw'
			}
		}
	}

	onFormChange = (e, {name, value}) => {
		const clone = _.cloneDeep(this.state.data)
		this.setState({ data: _.set(clone, [name], value)})
	}

	onSubmit = e => {
		this.setState({ loading: true })
		this.props.createTaskbot(this.state.data).then(() => {
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
			<Button onClick={this.onSubmit} content='Create Taskbot' icon={'plus'} color='green' />
		</Form>
	}
}

const mapStateToProps = (state, props) => ({
	
})

export default compose(
	connect(mapStateToProps, { createTaskbot }),
	toJS
)(CreateTaskbotPage)