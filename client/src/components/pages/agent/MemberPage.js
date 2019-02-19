import React from 'react'
import _ from 'lodash'
import moment from 'moment'
import { NavLink } from 'react-router-dom'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import Dropzone from "react-dropzone"
import { fetchGroups, uploadGroups, trainGroups } from "actions/group"
import { fetchTaskbots } from '../../../actions/taskbot'
import FileDownload from "react-file-download"
import groupApis from "apis/group"
import { fetchMembers, updateMember } from '../../../actions/agent'
import { Table, Button, Icon, Dropdown, Label } from 'semantic-ui-react'
import toJS from 'components/utils/ToJS'

class Member extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			loading: false,
			paidtypeVals: [],
			changes: []
		}
	}

	componentDidMount() {
		this.setState({ loading: true })
		this.fetchMembers()
	}

	fetchMembers = () => {
		return this.props.fetchMembers().then(() => {
			const pts = this.props.members.map(el => ({
				id: el.id,
				pid: this.props.paidtypes.find(o => o.name === el.paid_type).id,
				value: el.paid_type
			}))
			this.setState({
				loading: false,
				paidtypeVals: pts
			})
		})
	}

	onPaidtypeChange = (id, e, data) => {
		const newValue = data.value
		const { paidtypeVals } = this.state
		const { paidtypes, members } = this.props
		const changed = paidtypeVals.find(el => el.id === id)
		changed.pid = newValue
		changed.value = paidtypes.find(el => el.id === newValue).name
		const changes = members.map(member => {
			const curPT = paidtypeVals.find(pt => pt.id === member.id)
			return {id: member.id, pid: curPT.pid, changed: curPT.value !== member.paid_type, value: curPT.value}
		}).filter(el => el.changed)
		this.setState({
			paidtypeVals,
			changes
		})
	}

	onSaveButtonClick = e => {
		this.setState({ loading: true })
		const { changes } = this.state
		const promises = changes.map(c => this.props.updateMember(c.id, { paid_type: c.pid }))
		Promise.all(promises).then(() => {
			this.fetchMembers().then(() => {
				this.setState({ loading: false })
			})
		}).catch(() => {
			this.setState({ loading: false })
		})
	}

	render() {
		const { members, paidtypes, match } = this.props
		const { paidtypeVals, changes } = this.state
		const { loading } = this.state

		const combMembers = members.map(member => {
			const pval = paidtypeVals.find(pt => pt.id === member.id) || {id: null, pid: null, value: null}
			return Object.assign({paidtype_val: pval}, member)
		})

		const ptOptions = _.map(paidtypes, el => ({
			text: `${el.name} - (${el.bot_amount} bots, ${el.faq_amount} faqs)`,
			value: el.id,
			key: el.id
		}))

		return <div>
			<Button content='Save Changes' color='blue' icon='save' floated='right' disabled={changes.length === 0} onClick={this.onSaveButtonClick} loading={loading} />
			<br /><br />
			<Table size='small'>
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell>Name</Table.HeaderCell>
						<Table.HeaderCell>Bots</Table.HeaderCell>
						<Table.HeaderCell>FAQ</Table.HeaderCell>
						<Table.HeaderCell>Plan</Table.HeaderCell>
						<Table.HeaderCell>Activated on</Table.HeaderCell>
						<Table.HeaderCell>Expired on</Table.HeaderCell>
						<Table.HeaderCell>Actions</Table.HeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{members && combMembers && _.map(combMembers, member => {
						const paidtype = paidtypes.find(el => el.name === member.paid_type)
						const botLimit = paidtype ? paidtype.bot_amount : 0
						const faqLimit = paidtype ? paidtype.faq_amount : 0
						return <Table.Row key={member.id}>
							<Table.Cell>{member.username}</Table.Cell>
							<Table.Cell>{member.bot_amount} / {botLimit === 0 ? '∞' : botLimit}</Table.Cell>
							<Table.Cell>{member.faq_amount} / {faqLimit === 0 ? '∞' : faqLimit}</Table.Cell>
							<Table.Cell>
								<Label basic color={(paidtype && member.paidtype_val.pid === paidtype.id) ? 'black' : 'blue'}>
									<Dropdown options={ptOptions} value={member.paidtype_val.pid} onChange={this.onPaidtypeChange.bind(null, member.id)} />
								</Label>
								{(paidtype && member.paidtype_val.pid !== paidtype.id) && <Icon name='exclamation' color='blue' title='Unsaved changes' />}
							</Table.Cell>
							<Table.Cell>{member.start_date ? moment(member.start_date, 'YYYY-MM-DD HH:mm:ss.SSSZ').format('YYYY-MM-DD HH:mm') : 'N/A'}</Table.Cell>
							<Table.Cell>{member.expire_date ? moment(member.expire_date, 'YYYY-MM-DD HH:mm:ss.SSSZ').format('YYYY-MM-DD HH:mm') : 'N/A'}</Table.Cell>
							<Table.Cell>
								<NavLink to={`${match.path}/${member.id}`} className='ui button' role='button'>
									<Icon name='android' />
									Taskbots
								</NavLink>
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
	paidtypes: state.getIn(['user', 'packages'])
})

export default compose(
	connect(mapStateToProps, { fetchMembers, uploadGroups, fetchGroups, trainGroups, updateMember, fetchTaskbots }),
	toJS,
	translate()
)(Member)