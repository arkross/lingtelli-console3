import React from 'react';
import _ from 'lodash'
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { translate } from 'react-i18next';
import {
	Menu,
	Responsive,
	Dropdown,
	Segment
} from 'semantic-ui-react';
import { Route, NavLink, withRouter, matchPath, Switch, Redirect} from 'react-router-dom'
import { fetchBot, fetchHistory, fetchReport, fetchMatching } from 'actions/bot'
import { fetchGroups, deleteGroup } from 'actions/group'
import BotConfigPage from './BotConfigPage';
import AnalysisPage from './AnalysisPage';
import HistoryPage from './HistoryPage';
import RecomLogPage from './RecomLogPage'
import FAQConfigPage from './FAQConfigPage';
import BotDashboard from './BotDashboard'
import toJS from 'components/utils/ToJS'
import DemoModal from 'components/modals/DemoModal'
import TestBotPage from './TestBotPage';
import IntegrationPage from './IntegrationPage'
import FBIntegrationPage from './FBIntegrationPage'
import LineIntegrationPage from './LineIntegrationPage'
import WebIntegrationPage from './WebIntegrationPage'
import APIIntegrationPage from './APIIntegrationPage'

class ContentPage extends React.Component {
	state = {
		loading: true,
		openDemoModal: false,
		scale: 7
	}

	componentDidMount = () => {
		const that = this
		const { history } = this.props
		this.setState({loading: true})
		this.props.fetchBot(this.props.match.params.id)
			.then(() => {
				document.title = `LingBot | ${that.props.info.robot_name}` 
				that.setState({loading: false})
			})
			.catch(err => {
				history.push('/')
				return err
			})
	}

	componentDidUpdate = () => {
		if (this.props.info && this.props.info.robot_name) {
			document.title = `LingBot | ${this.props.info.robot_name}`
		}
	}

	componentWillReceiveProps = (nextProps) => {
		const that = this
		const { history } = this.props
		if ( nextProps.match.params.id !== this.props.match.params.id) {
			this.props.fetchBot(nextProps.match.params.id)
				.then(() => {
					document.title = `LingBot | ${nextProps.info.robot_name}`
					that.setState({loading: false})
				})
				.catch(err => {
					history.push('/')
					return err
				})
		}
		return {loading: true}
	}

	componentWillUnmount() {
		this.handleAfterFetch = () => Promise.resolve()
		this.handleErrorFetch = () => Promise.reject()
	}

	handleAfterFetch = (data) => {
		this.setState({ loading: false })
		return Promise.resolve(data)
	}

	handleErrorFetch = (err) => {
		this.setState({ loading: false })
		return Promise.reject(err)
	}

	onFetchHistory = (page = 1) => {
		this.setState({ loading: true })
		return this.props.fetchHistory(this.props.match.params.id, page)
			.then(this.handleAfterFetch, this.handleErrorFetch)
	}

	onFetchReport = (days = 7) => {
		this.setState({ loading: true })
		return this.props.fetchReport(this.props.match.params.id, days)
			.then(this.handleAfterFetch, this.handleErrorFetch)
	}

	onFetchMatching = (page = 1) => {
		this.setState({ loading: true })
		return this.props.fetchMatching(this.props.match.params.id, page)
			.then(this.handleAfterFetch, this.handleErrorFetch)
	}

	onFetchGroups = (page = 1, keyword = '') => {
		this.setState({ loading: true })
		return this.props.fetchGroups(this.props.match.params.id, page, keyword)
			.then(this.handleAfterFetch, this.handleErrorFetch)
	}

	onDeleteGroup = id => {
		this.setState({ loading: true })
		return this.props.deleteGroup(this.props.match.params.id, id)
			.then(this.handleAfterFetch, this.handleErrorFetch)
	}

	onOpenDemoModal = () => {
		this.setState({ openDemoModal: true })
	}

	onCloseDemoModal = () => {
		this.setState({ openDemoModal: false })
	}

	changeScale = (scale) => {
		this.setState({scale, loading: true})
		this.props.fetchReport(this.props.match.params.id, scale)
		.then( () => {
			this.setState({ loading: false })
		}, () => {
			this.setState({
				errors: {
					api: this.props.t('errors.analysis.fetch')
				},
				loading: false
			});
		})
	}

	changePath = (e, path) => {
		const {history} = this.props
		history.push(path.value)
	}

	render = () => {
		const { t, match, location, info, user } = this.props;
		const { loading, scale, openDemoModal } = this.state;

		const isHidden = user.paid_type === 'Staff' && !!info.assign_user

		const subMenus = [
			{ text: t('chatbot.setting.text') , id: 'setting'},
			{ text: t('chatbot.integration.facebook') , id: 'integration/facebook', hide: isHidden},
			{ text: t('chatbot.integration.line') , id: 'integration/line', hide: isHidden},
			{ text: t('chatbot.integration.web') , id: 'integration/web'},
			{ text: t('chatbot.integration.api') , id: 'integration/api'},
			{ text: t('chatbot.analysis.text'), id: 'analysis' },
			{ text: t('chatbot.history.text'), id: 'history'},
			{ text: t('chatbot.recommendations.text'), id: 'recommendations'},
			{ text: t('chatbot.faq.text'), id: 'faq' },
			{ text: t('chatbot.test.text'), id: 'test'}
		]
		.filter(el => !el.hide)
		.map(el => Object.assign({value: `${match.url}/${el.id}`, key: el.id}, el))

		const dropdownMenu = [{
			text: t('chatbot.top_page.text'),
			id: '',
			key: '',
			value: match.url
		}, ...subMenus]
		const currentMenu = _.findLast(dropdownMenu, el => matchPath(location.pathname, {path: `${match.url}/${el.id}`}))
		const renderItems = subMenus.map( (item, ix) => (

			<NavLink
				className='item'
				to={`${match.url}/${item.id}`}
				size='tiny'
				key={ix}
				id={item.id}
				style={{
					flex: '0 0 auto'
				}}
			>{item.text}</NavLink>
		));

		// renderItems.push(<Menu.Menu key='testbot' position='right'><Menu.Item><Button onClick={this.onOpenDemoModal} color='green'><Icon name='play'></Icon> {t('demo.button')}</Button></Menu.Item></Menu.Menu>)

		return (
			<div className='bot-page'>
				<Responsive as={Menu} pointing className='topmenu' style={{
					display: 'flex',
					flexWrap: 'nowrap',
					overflowX: 'auto',
					overflowY: 'hidden',
					WebkitOverflowScrolling: 'touch',
					msOverflowStyle: '-ms-autohiding-scrollbar'
				}}>
					{renderItems}
				</Responsive>
				<Responsive as={Dropdown} maxWidth={Responsive.onlyTablet.maxWidth} options={dropdownMenu} value={currentMenu && currentMenu.value} onChange={this.changePath}>
				</Responsive>
				{openDemoModal && <DemoModal
					match={match}
					open={openDemoModal}
					closeModal={this.onCloseDemoModal}
				/>}
				<Switch>
					<Route path={`${match.path}/`} exact render={props => <BotDashboard loading={loading} fetchData={this.onFetchReport} scale={scale} {...props} onChangeScale={this.changeScale} />} />
					<Route path={`${match.path}/setting`} render={props => <Segment loading={loading}><BotConfigPage {...props} /></Segment>} />
					<Route path={`${match.path}/faq`} render={props => <Segment loading={loading}><FAQConfigPage {...props} fetchData={this.onFetchGroups} deleteData={this.onDeleteGroup} /></Segment>} />
					<Route path={`${match.path}/analysis`} render={props => <Segment loading={loading}><AnalysisPage fetchData={this.onFetchReport} loading={loading} scale={scale}  {...props} onChangeScale={this.changeScale} /></Segment>} />
					<Route path={`${match.path}/history`} render={props => <Segment loading={loading}><HistoryPage {...props} fetchData={this.onFetchHistory} /></Segment>} />
					<Route path={`${match.path}/recommendations`} render={props => <Segment loading={loading}><RecomLogPage {...props} fetchData={this.onFetchMatching} /></Segment>} />
					<Route path={`${match.path}/test`} render={props => <Segment loading={loading}><TestBotPage {...props} /></Segment>} />
					<Route path={`${match.path}/integration/facebook`} render={props => <Segment loading={loading}><FBIntegrationPage {...props} /></Segment>} />
					<Route path={`${match.path}/integration/line`} render={props => <Segment loading={loading}><LineIntegrationPage {...props} /></Segment>} />
					<Route path={`${match.path}/integration/web`} render={props => <Segment loading={loading}><WebIntegrationPage {...props} /></Segment>} />
					<Route path={`${match.path}/integration/api`} render={props => <Segment loading={loading}><APIIntegrationPage {...props} /></Segment>} />
					<Route render={props => <Redirect to='/' />} />
				</Switch>
			</div>
		)
	}
}

const mapStateToProps = (state, props) => ({
	user: state.get('user'),
	info: state.getIn(['bot', 'bots', props.match.params.id]) || {}
});

export default compose(
	translate('translations'),
	withRouter,
	connect(mapStateToProps, {fetchBot, fetchHistory, fetchReport, fetchMatching, fetchGroups, deleteGroup}),
	toJS
)(ContentPage);
