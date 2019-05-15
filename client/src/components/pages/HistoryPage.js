import React, {Fragment} from 'react';
import _ from 'lodash'
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { translate } from 'react-i18next';
import {
	Header,
	Table,
	Container,
	Dimmer,
	Loader,
	Menu,
	Button,
	Input,
	Form,
	Dropdown
} from 'semantic-ui-react';
import { NavLink } from 'react-router-dom'
import toJS from 'components/utils/ToJS'
import qs from 'query-string'
import LingPagination from '../utils/LingPagination'
import { fetchHistory } from 'actions/bot'

class HistoryPage extends React.Component {
	constructor(props) {
		super(props)
		const params = props.location ? qs.parse(props.location.search) : {page: 1}
		this.state = {
			platform: '',
			uid: '',
			activePage: params.page || 1,
			columnReversed: false
		}
	}

	fetchData = (platform, uid, activePage) => {
		this.props.fetchData(platform || this.state.platform, uid || this.state.uid, activePage || this.state.activePage)
	}

	componentDidMount() {
		this.fetchData()
	}

	onPageChanged = (e, { activePage }) => {
		this.setState({ activePage })
		this.fetchData(this.state.platform, this.state.uid, activePage)
	}

	createHistoryElements = () => {
		const { histories } = this.props
		const { columnReversed } = this.state
		return histories.results ?
		_.chain(histories.results)
			.groupBy('qa_pair')
			.map(pair => {
				const userContent = _.chain(pair)
					.filter(rec => rec.sender === 'USER')
					.map(rec => rec.content)
					.value()
				const botContent = _.chain(pair)
					.filter(rec => rec.sender === 'BOT')
					.map(rec => rec.content)
					.value()
				return {
					user: userContent.join(' | '),
					bot: botContent.join(' | '),
					created_at: pair[0].created_at
				}
			})
			.map((history, index) => 
				<Table.Row active={history.sender==='USER'} key={index}>
					<Table.Cell>
						{columnReversed ? history.bot : history.user}
					</Table.Cell>
					<Table.Cell>
						{columnReversed ? history.user : history.bot}
					</Table.Cell>
					<Table.Cell>
						{history.created_at}
					</Table.Cell>
					<Table.Cell>{history.platform}</Table.Cell>
					<Table.Cell>{history.user_id}</Table.Cell>
				</Table.Row>
			)
			.value()
		: []
	}

	onSwitchClick = e => {
		e.preventDefault()
		this.setState({ columnReversed: !this.state.columnReversed })
	}

	onFilterChange = (e, { value }) => {
		e.preventDefault()
		this.setState({ platform: value })
		this.fetchData(value, this.state.uid, this.state.activePage)
	}

	onInputUidChange = (e, { value }) => {
		e.preventDefault()
		this.setState({ uid: value })
	}

	onFilterSubmit = e => {
		e.preventDefault()
		this.fetchData()
	}

	render = () => {
		const { activePage, columnReversed, platform, uid } = this.state
		const { histories, t, loading, location, activeBot } = this.props

		const platformOptions = [
			{value: '', text: t('chatbot.history.platforms.all')},
			{value: 'FB', text: t('chatbot.history.platforms.fb')},
			{value: 'LINE', text: t('chatbot.history.platforms.line')},
			{value: 'WEB', text: t('chatbot.history.platforms.web')},
			{value: 'API', text: t('chatbot.history.platforms.api')},
			{value: 'OTHER', text: t('chatbot.history.platforms.other')}
		]

		const centerStyle = {
			width: '35%',
			margin: 'auto'
		}

		const perPage = 50
		const totalPage = Math.ceil(histories.count / perPage)
		return (<Fragment>
			<Menu secondary>
					<NavLink className='item' to={`/dashboard/bot/${activeBot}/analysis`} exact>{t('chatbot.analysis.text')}</NavLink>
					<NavLink className='item' to={`/dashboard/bot/${activeBot}/analysis/history`}>{t('chatbot.history.text')}</NavLink>
					<NavLink className='item' to={`/dashboard/bot/${activeBot}/analysis/recommendations`}>{t('chatbot.recommendations.text')}</NavLink>
				</Menu>
			<Container fluid className='history-container'>
				<Loader active={loading} />
				<Dimmer inverted active={loading} />
				{(!histories.results || !histories.count) && <Header as='h4' textAlign='center'>{t('chatbot.history.empty')}</Header>} 
				{(!!histories.results && !!histories.count) &&
				<div>
					<Form onSubmit={this.onFilterSubmit}>
						<Form.Group>
							<Form.Field>
								<label>{t('chatbot.history.filter')}</label>
								<Dropdown selection options={platformOptions} placeholder={t('chatbot.history.platform')} value={platform} onChange={this.onFilterChange} />
							</Form.Field>
							<Form.Field>
								<label>{t('chatbot.history.uid')}</label>
								<Input placeholder={t('chatbot.history.uid')} value={uid} onChange={this.onInputUidChange} />
							</Form.Field>
						</Form.Group>
					</Form>
					<Button icon='exchange' primary floated='right' content={t('chatbot.history.toggle')} onClick={this.onSwitchClick} />
					<br /><br />
					<Table celled>
						<Table.Header>
							<Table.Row>
								<Table.HeaderCell style={{width: '30%'}}>{columnReversed ? t('chatbot.history.bot') : t('chatbot.history.user')}</Table.HeaderCell>
								<Table.HeaderCell style={{width: '30%'}}>{columnReversed ? t('chatbot.history.user') : t('chatbot.history.bot')}</Table.HeaderCell>
								<Table.HeaderCell style={{width: '20%'}}>{t('chatbot.history.datetime')}</Table.HeaderCell>
								<Table.HeaderCell style={{width: '10%'}}>{t('chatbot.history.platform')}</Table.HeaderCell>
								<Table.HeaderCell style={{width: '10%'}}>{t('chatbot.history.uid')}</Table.HeaderCell>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{this.createHistoryElements()}
						</Table.Body>
					</Table>
					{
						totalPage > 0 &&
							<div className='pagination-container' style={centerStyle}>
								<LingPagination
									history={this.props.history}
									location={location}
									activePage={activePage}
									onPageChange={this.onPageChanged}
									totalPages={totalPage}
								/>
							</div>
					}
				</div>}
			</Container>
			</Fragment>
		);
	};
}

const mapStateToProps = (state, ownProps) => ({
	activeBot: ownProps.match.params.id,
	histories: state.getIn(['bot', 'bots', ownProps.match.params.id, 'history']) || {}
});

export default compose(
	translate('translations'),
	connect(mapStateToProps),
	toJS
)(HistoryPage);
