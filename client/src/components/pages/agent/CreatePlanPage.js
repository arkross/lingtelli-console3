import React from 'react'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import _ from 'lodash'
import Dropzone from "react-dropzone"
import { fetchGroups, uploadGroups, trainGroups } from "actions/group"
import { Button, Icon, Form, Input, Dropdown } from 'semantic-ui-react'
import FileDownload from "react-file-download"
import groupApis from "apis/group"
import { createPackage } from '../../../actions/user'
import { fetchPlatforms } from '../../../actions/bot'
import toJS from 'components/utils/ToJS'

class CreatePlanPage extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			loading: false,
			data: {
				name: '',
				duration: '1_d',
				bot_amount: 1,
				faq_amount: 100,
				third_party: []
			}
		}
	}

	componentDidMount() {
		this.setState({loading: true})
		this.props.fetchPlatforms(() => {
			this.setState({loading: false})
		})
	}

	onFormChange = (e, {name, value}) => {
		const clone = _.cloneDeep(this.state.data)
		const durSplit = this.state.data.duration.split('_')
		if (name === 'durNumber') {
			this.setState({data: _.set(clone, ['duration'], `${value}_${durSplit[1]}`)})
		}
		else if (name === 'durUnit') {
			this.setState({data: _.set(clone, ['duration'], `${durSplit[0]}_${value}`)})
		} else {
			this.setState({ data: _.set(clone, [name], value)})
		}

	}

	onSubmit = e => {
		this.setState({ loading: true })
		this.props.createPackage(this.state.data).then(() => {
			this.setState({ loading: false })
			this.props.history.push('/agent/plan')
		})
	}

	render() {
		const { data } = this.state
		const { platforms } = this.props
		const ddOptions = platforms.map(plat => ({
			key: plat.id,
			text: plat.name,
			value: plat.id
		}))
		const timeUnitOptions = [
			{key: 0, text: '∞', value: '0'},
			{key: 'd', text: 'Day(s)', value: 'd'},
			{key: 'y', text: 'Year(s)', value: 'y'}
		]
		const durElements = data.duration.split('_')
		const durDropdowns = <Input name='durNumber' value={durElements[0]} type='number' onChange={this.onFormChange} action>
			<input style={{width: '50px'}} />
			<Dropdown selection options={timeUnitOptions} name='durUnit' onChange={this.onFormChange} value={durElements[1]} />
		</Input>

		return <Form>
			<Form.Field
				id='name'
				name='name'
				label='Name'
				control={Input}
				value={data.name}
				onChange={this.onFormChange} />
			<Form.Field>
				<label>Duration</label>
				{durDropdowns}
			</Form.Field>
			<Form.Field
				id='bot_amount'
				name='bot_amount'
				label='Bot Limit'
				control={Input}
				type='number'
				min={0}
				step={1}
				value={data.bot_amount}
				onChange={this.onFormChange} />
			<Form.Field
				id='faq_amount'
				name='faq_amount'
				label='FAQ Limit'
				control={Input}
				min={0}
				step={1}
				type='number'
				value={data.faq_amount}
				onChange={this.onFormChange} />
			<Form.Field
				id='third_party'
				name='third_party'
				label='Third Party Integrations'
				control={Dropdown}
				fluid multiple selection options={ddOptions} 
				value={data.third_party}
				onChange={this.onFormChange} />
			<Button onClick={this.onSubmit} content='Create Plan' icon={'plus'} color='green' />
		</Form>
	}
}

const mapStateToProps = (state, props) => ({
	platforms: state.getIn(['bot', 'supportPlatforms'])
})

export default compose(
	connect(mapStateToProps, { createPackage, fetchPlatforms }),
	toJS
)(CreatePlanPage)