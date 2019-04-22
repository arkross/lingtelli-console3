import React, {Fragment} from 'react'
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
import { fetchMembers, updateMember, fetchMember } from '../../../actions/agent'
import { Table, Button, Icon, Dropdown, Label, Segment, Input, Form} from 'semantic-ui-react'
import LingPagination from '../../utils/LingPagination'
import toJS from 'components/utils/ToJS'
import qs from 'query-string'

class Member extends React.Component {
	constructor(props) {
		super(props)
		const search = qs.parse(props.location.search)
		this.state = {
			loading: false,
			pageInput: search.page || 1,
			activePage: search.page || 1,
			search: search.username,
			paidtypeVals: [],
			changes: []
		}
	}

	componentDidMount() {
		this.setState({ loading: true })
		this.fetchMembers()
	}

	fetchMembers = (activePage, username) => {
		this.setState({ loading: true })
		return this.props.fetchMembers(activePage || this.state.activePage, username || this.state.search).then(() => {
			const pts = this.props.members.results.map(el => ({
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
		const changes = members.results.map(member => {
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
		const promises = changes.map(c => this.props.updateMember(c.id, { paid_type: c.pid }).then(() => this.props.fetchMember(c.id)))
		Promise.all(promises).then(() => {
			this.setState({ loading: false })
		}).catch(() => {
			this.setState({ loading: false })
		})
	}

	onPageChanged = (e, { activePage }) => {
		this.setState({ activePage, loading: true })
		return this.fetchMembers(activePage)
	}

	onSearchChange = (e, { value }) => {
		this.setState({ search: value })
	}

	onSearchSubmit = e => {
		e.preventDefault()
		if (this.props.history) {
			const params = this.props.location ? qs.parse(this.props.location.search) : {username: this.state.search}
			params.username = this.state.search
			this.props.history.push({
				search: `?${qs.stringify(params)}`
			})
		}
		this.fetchMembers(this.state.activePage, this.state.search)
	}

	render() {
		const { members, paidtypes, match, location, history } = this.props
		const { paidtypeVals, changes, activePage, pageInput, search } = this.state
		const { loading } = this.state

		const perPage = 30
		const totalPages = Math.ceil(members.count / perPage)

		const combMembers = members.results.map(member => {
			const pval = paidtypeVals.find(pt => pt.id === member.id) || {id: null, pid: null, value: null}
			return Object.assign({paidtype_val: pval}, member)
		})

		const ptOptions = _.map(paidtypes, el => ({
			text: `${el.name} - (${el.bot_amount} bots, ${el.faq_amount} faqs)`,
			value: el.id,
			key: el.id
		}))

		return <div>
			<Form onSubmit={this.onSearchSubmit}>
				<Input type='text' icon='search' value={search} onChange={this.onSearchChange} name='username' placeholder='Search Username' style={{float: 'left'}} />
				<Button style={{display: 'none'}} />
			</Form>
			<Button content='Save Changes' color='blue' icon='save' floated='right' disabled={changes.length === 0} onClick={this.onSaveButtonClick} loading={loading} />
			<br /><br />
			<Segment basic loading={loading}>
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
			</Segment>
			{
				totalPages > 0 &&
					<LingPagination
						history={history}
						location={location}
						activePage={activePage}
						onPageChange={this.onPageChanged}
						totalPages={totalPages}
					/>
			}
		</div>
	}
}

const mapStateToProps = (state, props) => ({
	members: state.getIn(['agent', 'members']) || {},
	paidtypes: state.getIn(['user', 'packages'])
})

export default compose(
	connect(mapStateToProps, { fetchMembers, uploadGroups, fetchGroups, trainGroups, updateMember, fetchTaskbots, fetchMember }),
	toJS,
	translate()
)(Member)