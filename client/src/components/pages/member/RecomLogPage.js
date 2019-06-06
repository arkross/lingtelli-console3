import React, {Component, Fragment} from 'react'
import { connect } from 'react-redux'
import { compose } from 'recompose'
import { translate } from 'react-i18next'
import toJS from 'components/utils/ToJS'
import { fetchMatching } from 'actions/bot'
import { NavLink } from 'react-router-dom'
import { Header, Table, Container, Dimmer, Loader, Icon, Menu, Form, Dropdown, Input } from 'semantic-ui-react'
import LingPagination from '../../utils/LingPagination'
import qs from 'query-string'
import _ from 'lodash'

class RecomLogPage extends Component {
	constructor(props) {
		super(props)
		const params = props.location ? qs.parse(props.location.search) : {page: 1}
		this.state = {
			platform: params.platform || 'ALL',
			uid: params.uid || '',
			activePage: params.page || 1,
			loading: true
		}
	}

	handleAfterFetch = () => {
		this.setState({ loading: false})
	}

	componentWillUnmount() {
		this.handleAfterFetch = () => {}
	}

	componentDidMount() {
		this.fetchMatching()
	}

	fetchMatching = (platform='ALL', uid='', activePage=null) => {
		this.setState({ loading: true })
		this.props.fetchMatching(this.props.activeBot, platform || this.state.platform, uid || this.state.uid, activePage || this.state.activePage)
			.then(data => {
				this.handleAfterFetch()
			}, err => {
				this.handleAfterFetch()
			})
	}

	changeUrlQuery = data => {
		const params = this.props.location ? qs.parse(this.props.location.search) : {}
		params.platform = data.platform || params.platform || 'ALL'
		params.uid= data.uid || ''
		this.props.history.push({
			search: `?${qs.stringify(params)}`
		})
	}

	onPageChanged = (e, {activePage}) => {
		this.setState({ activePage })
		this.fetchMatching(this.state.platform, this.state.uid, activePage)
	}
	
	onFilterChange = (e, { value }) => {
		e.preventDefault()
		this.setState({ platform: value, activePage: 1 })
		this.changeUrlQuery({ platform: value })
		this.fetchMatching(value, this.state.uid, 1)
	}

	onInputUidChange = (e, { value }) => {
		e.preventDefault()
		this.setState({ uid: value })
	}

	onFilterSubmit = e => {
		e.preventDefault()
		this.setState({ activePage: 1 })
		this.changeUrlQuery({ uid: this.state.uid })
		this.fetchMatching(this.state.platform, this.state.uid, 1)
	}

	render() {
		const { t, data, location, history, activeBot } = this.props
		const { loading, activePage, platform, uid } = this.state

		const perPage = 10
		const totalPages = Math.ceil(data.count / perPage)

		const platformOptions = [
			{value: 'ALL', text: t('chatbot.history.platforms.all')},
			{value: 'FB', text: t('chatbot.history.platforms.fb')},
			{value: 'LINE', text: t('chatbot.history.platforms.line')},
			{value: 'WEB', text: t('chatbot.history.platforms.web')},
			{value: 'API', text: t('chatbot.history.platforms.api')},
			{value: 'OTHER', text: t('chatbot.history.platforms.other')}
		]
		
		return <div className={`analysis-container`}>
			<Loader active={loading} />
			<Form onSubmit={this.onFilterSubmit}>
				<Form.Group>
					<Form.Field>
						<label>{t('chatbot.recommendations.filter')}</label>
						<Dropdown selection options={platformOptions} placeholder={t('chatbot.recommendations.platform')} value={platform} onChange={this.onFilterChange} />
					</Form.Field>
					<Form.Field>
						<label>{t('chatbot.history.uid')}</label>
						<Input placeholder={t('chatbot.recommendations.uid')} value={uid} onChange={this.onInputUidChange} />
					</Form.Field>
				</Form.Group>
			</Form>
			{ (data && data.count) ? 
			<div>
				<Table celled>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell>
								{t('chatbot.recommendations.ori_question')}
							</Table.HeaderCell>
							<Table.HeaderCell>
								{t('chatbot.recommendations.selected_question')}
							</Table.HeaderCell>
							<Table.HeaderCell>
								{t('chatbot.recommendations.platform')}
							</Table.HeaderCell>
							<Table.HeaderCell>
								{t('chatbot.recommendations.uid')}
							</Table.HeaderCell>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{_.map(data.results, el => <Table.Row key={el.id}>
							<Table.Cell>{el.ori_question}</Table.Cell>
							<Table.Cell>{el.select_question}</Table.Cell>
							<Table.Cell>{el.platform}</Table.Cell>
							<Table.Cell>{el.user_id}</Table.Cell>
						</Table.Row>)}
					</Table.Body>
				</Table>
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
			</div> : <Header as='h4' textAlign='center'>{t('chatbot.history.empty')}</Header>}
		</div>
	}
}

const mapStateToProps = (state, props) => ({
	data: state.getIn(['bot', 'bots', props.match.params.id, 'recomlog']) || {},
	activeBot: props.match.params.id
})

export default compose(
	translate(),
	connect(mapStateToProps, { fetchMatching }),
	toJS
)(RecomLogPage)
