import React from 'react'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import _ from 'lodash'
import { Form, Table, Button, Label, Dropdown, Input } from 'semantic-ui-react'
import { fetchPackages } from '../../../actions/user'
import { fetchPlatforms } from '../../../actions/bot'
import toJS from 'components/utils/ToJS'

class Plan extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			loading: false,
			paidtypes: props.paidtypes
		}
	}
	componentDidMount() {
		this.setState({loading: true})
		this.props.fetchPlatforms().then(() => {
			this.fetchPaidtypes()
		})
	}
	fetchPaidtypes = () => {
		this.props.fetchPackages()
			.then(data => {
				this.setState({loading: false, paidtypes: this.props.paidtypes })
			})
	}
	onFormChange = (id, e, {name, value}) => {
		const { paidtypes } = this.state
		const ptClone = _.cloneDeep(this.state.paidtypes)
		const index = _.findIndex(ptClone, pt => pt.id === id)
		if (name !== 'durNumber' && name !== 'durUnit') {
			const newState = _.set(ptClone, [index, name], value)
		} else {
			const durElements = _.get(ptClone, [index, 'duration'], '0_0').split('_')
			if (name === 'durNumber') {
				_.set(ptClone, [index, 'duration'], `${value}_${durElements[1]}`)
			} else if (name === 'durUnit') {
				_.set(ptClone, [index, 'duration'], `${durElements[0]}_${value}`)
			}
		}
		this.setState({ paidtypes: ptClone })
	}
	onSaveButtonClick = e => {

	}
	render() {
		const { paidtypes, loading } = this.state
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
		return <div>
			<Button content='Save Changes' color='blue' icon='save' floated='right' onClick={this.onSaveButtonClick} loading={loading} />
			<Table size='small'>
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell>Name</Table.HeaderCell>
						<Table.HeaderCell>Bot Limit</Table.HeaderCell>
						<Table.HeaderCell>FAQ Limit</Table.HeaderCell>
						<Table.HeaderCell>Duration</Table.HeaderCell>
						<Table.HeaderCell>Third Party</Table.HeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{paidtypes && _.map(paidtypes, pt => {
						const durElements = pt.duration.split('_')
						const durDropdowns =
							<Input name='durNumber' value={durElements[0]} type='number' onChange={this.onFormChange.bind(null, pt.id)} action>
								<input style={{width: '50px'}} />
								<Dropdown selection options={timeUnitOptions} name='durUnit' onChange={this.onFormChange.bind(null, pt.id)} value={durElements[1]} />
							</Input>
						return <Table.Row key={pt.id}>
							<Table.Cell><Input name='name' value={pt.name} type='text' onChange={this.onFormChange.bind(null, pt.id)} /></Table.Cell>
							<Table.Cell><Input fluid name='bot_amount' min='0' step='1' value={pt.bot_amount} type='number' onChange={this.onFormChange.bind(null, pt.id)}><input style={{ minWidth: '50px'}} /></Input></Table.Cell>
							<Table.Cell><Input fluid name='faq_amount' min='0' step='1' value={pt.faq_amount} type='number' onChange={this.onFormChange.bind(null, pt.id)}><input minLength={5} style={{minWidth: '50px'}} /></Input></Table.Cell>
							<Table.Cell>{durDropdowns}</Table.Cell>
							<Table.Cell><Dropdown fluid multiple selection options={ddOptions} onChange={this.onFormChange.bind(null, pt.id)} value={pt.third_party.map(tp => tp.id)} /></Table.Cell>
						</Table.Row>
					})}
				</Table.Body>
			</Table>
		</div>
	}
}

const mapStateToProps = (state, props) => ({
	paidtypes: state.getIn(['user', 'packages']),
	platforms: state.getIn(['bot', 'supportPlatforms'])
})

export default compose(
	connect(mapStateToProps, {fetchPackages, fetchPlatforms}),
	toJS,
	translate()
)(Plan)