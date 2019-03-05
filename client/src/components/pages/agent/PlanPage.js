import React from 'react'
import { NavLink } from 'react-router-dom'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import _ from 'lodash'
import { Form, Table, Button, Label, Dropdown, Input, Icon } from 'semantic-ui-react'
import { fetchPackages, updatePackage } from '../../../actions/user'
import { fetchPlatforms } from '../../../actions/bot'
import toJS from 'components/utils/ToJS'

class Plan extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			loading: false,
			paidtypes: props.paidtypes,
			changes: []
		}
	}
	componentDidMount() {
		this.setState({loading: true})
		this.props.fetchPlatforms().then(() => {
			this.fetchPaidtypes()
		})
	}
	fetchPaidtypes = () => {
		return this.props.fetchPackages()
			.then(data => {
				this.calculateChanges(this.props.paidtypes)
				this.setState({ loading: false })
			})
	}
	calculateChanges = (newPaidtypes) => {
		const changes = _.filter(newPaidtypes, pt => JSON.stringify(this.props.paidtypes.find(dpt => dpt.id === pt.id)) !== JSON.stringify(pt))
		this.setState({ paidtypes: newPaidtypes, changes })
	}
	onFormChange = (id, e, {name, value}) => {
		const { paidtypes } = this.state
		const ptClone = _.cloneDeep(this.state.paidtypes)
		const index = _.findIndex(ptClone, pt => pt.id === id)
		if (name !== 'durNumber' && name !== 'durUnit' && name !== 'third_party') {
			_.set(ptClone, [index, name], value)
		} else if (name === 'third_party') {
			const newTPs = this.props.platforms.filter(el => value.indexOf(el.id) >= 0)
			_.set(ptClone, [index, name], newTPs)
		} else {
			const durElements = _.get(ptClone, [index, 'duration'], '0_0').split('_')
			if (name === 'durNumber') {
				_.set(ptClone, [index, 'duration'], `${value}_${durElements[1]}`)
			} else if (name === 'durUnit') {
				_.set(ptClone, [index, 'duration'], `${durElements[0]}_${value}`)
			}
		}
		this.calculateChanges(ptClone)
	}
	onSaveButtonClick = e => {
		const { paidtypes, changes } = this.state
		const promises = changes.map(pt => this.props.updatePackage(pt.id, {
			third_party: pt.third_party.map(el => el.id),
			name: pt.name,
			bot_amount: pt.bot_amount,
			faq_amount: pt.faq_amount,
			duration: pt.duration
		}))
		this.setState({loading: true})
		return Promise.all(promises).finally(() => {
			return this.fetchPaidtypes()
		})
	}
	render() {
		const { paidtypes, loading, changes } = this.state
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
			<NavLink to='/agent/plan/create' className='ui button green'><Icon name='plus' /> Create</NavLink>
			<Button content='Save Changes' color='blue' icon='save' floated='right' onClick={this.onSaveButtonClick} loading={loading} disabled={changes.length === 0} />
			<br /><br />
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
						const isChanged = changes.findIndex(c => c.id === pt.id) >= 0
						const durElements = pt.duration.split('_')
						const durDropdowns =
							<Input name='durNumber' value={durElements[0]} type='number' onChange={this.onFormChange.bind(null, pt.id)} action>
								<input style={{width: '50px'}} />
								<Dropdown selection options={timeUnitOptions} name='durUnit' onChange={this.onFormChange.bind(null, pt.id)} value={durElements[1]} />
							</Input>
						return <Table.Row key={pt.id} warning={isChanged}>
							<Table.Cell><Input name='name' value={pt.name} type='text' onChange={this.onFormChange.bind(null, pt.id)} /></Table.Cell>
							<Table.Cell><Input fluid name='bot_amount' min='0' step='1' value={pt.bot_amount} type='number' onChange={this.onFormChange.bind(null, pt.id)}><input style={{ minWidth: '50px'}} /></Input></Table.Cell>
							<Table.Cell><Input fluid name='faq_amount' min='0' step='1' value={pt.faq_amount} type='number' onChange={this.onFormChange.bind(null, pt.id)}><input minLength={5} style={{minWidth: '50px'}} /></Input></Table.Cell>
							<Table.Cell>{durDropdowns}</Table.Cell>
							<Table.Cell><Dropdown fluid multiple selection options={ddOptions} name='third_party' onChange={this.onFormChange.bind(null, pt.id)} value={pt.third_party.map(tp => tp.id)} /></Table.Cell>
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
	connect(mapStateToProps, {fetchPackages, fetchPlatforms, updatePackage}),
	toJS,
	translate()
)(Plan)