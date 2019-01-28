import React from 'react'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import _ from 'lodash'
import { Table, Button, Label } from 'semantic-ui-react'
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
	onFormChange = (id, e, data) => {
		
	}
	onSaveButtonClick = e => {

	}
	render() {
		const { paidtypes, loading } = this.state
		const { platforms } = this.props
		return <div>
			{/*<Button content='Save Changes' color='blue' icon='save' floated='right' onClick={this.onSaveButtonClick} loading={loading} />*/}
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
						return <Table.Row key={pt.id}>
							<Table.Cell>{pt.name}</Table.Cell>
							<Table.Cell>{pt.bot_amount}</Table.Cell>
							<Table.Cell>{pt.faq_amount}</Table.Cell>
							<Table.Cell>{pt.duration}</Table.Cell>
							<Table.Cell>{pt.third_party.map(plat => <Label key={plat.id}>
								{plat.name}
							</Label>)}</Table.Cell>
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