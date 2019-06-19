import React from 'react'
import _ from 'lodash'
import { Switch, Route, Redirect, Link, matchPath } from 'react-router-dom'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { Dimmer, Loader, Dropdown, Menu, Divider, Container, Message, Icon, Label, Header, Modal} from 'semantic-ui-react'
import LingBreadcrumbs from 'components/utils/LingBreadcrumbs'
import setAuthorizationHeader from 'utils/setAuthorizationHeader'
import DemoModal from '../../modals/DemoModal'
import toJS from 'components/utils/ToJS'
import { logout, fetchAgent } from 'actions/agent'
import { fetchPackages } from 'actions/user'
import { hideAllMessages } from 'actions/message'

import ProfilePage from './ProfilePage'
import MemberPage from './MemberPage'
import LoginPage from './LoginPage'
import PlanPage from './PlanPage'
import CreatePlanPage from './CreatePlanPage'
import TaskbotsPage from './TaskbotsPage'
import CreateTaskbotPage from './CreateTaskbotPage'
import TaskbotDetailPage from './TaskbotDetailPage'
import TemplatesPage from './TemplatesPage'
import CreateTemplatePage from './CreateTemplatePage'
import TemplateDetailPage from './TemplateDetailPage'

const options = [
	{ key: 'en', text: 'English', value: 'en-US' },
	{ key: 'cn', text: '简体中文', value: 'zh-CN' },
	{ key: 'tw', text: '繁體中文', value: 'zh-TW' },
]

class Dashboard extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			loading: false,
			openDemoModal: false,
			activeItem: 'account',
			openSideMenu: false
		}
	}

	logout = () => {
		this.props.logout().then(() => {
			this.props.history.push('/login')
		})
	}

	componentDidMount() {
		const token = localStorage.getItem('agent_token')
		setAuthorizationHeader(token)
		// this.props.fetchDetail()
		this.props.fetchPackages()
		this.props.fetchAgent()
		this.updateBots()
		this.isUpdate = true
	}

	componentDidUpdate() {
	}

	updateBots = () => {
		// return this.props.fetchAllBotDetails()
	}

	handleItemClick = () => {
		return this.closeSidebar()
	}
	
	toggleSidebar = () => {
		this.setState({ openSideMenu : !this.state.openSideMenu })
	}

	closeSidebar = () => {
		this.setState({ openSideMenu: false })
	}
	
	onOpenDemoModal = () => {
		this.setState({ openDemoModal: true });
	}

	onCloseDemoModal = () => {
		this.setState({ openDemoModal: false });
	}

	onLanguageChanged = (e, { value }) => {
		const { i18n } = this.props
		i18n.changeLanguage(value)
	}

	onLogout = e => {
		e.preventDefault()
		this.props.logout()
			.then(() => this.props.history.push('/agent/login'))
	}

	render() {
		const {location, match, user, messages, t, history, hideAllMessages, showLoggedOut} = this.props
		const {loading, openDemoModal, openSideMenu} = this.state
		let dropdownText = _.find(options, el => el.value === localStorage.getItem('i18nextLng'))
		if ( ! dropdownText) {
			dropdownText = options[0]
		}

		const topMenuOptions = [
			{text: 'Members', id: 'member'},
			{text: 'Taskbots', id: 'taskbots'},
			{text: 'Templates', id: 'templates'},
			// {text: 'Profile', id: 'profile'},
			{text: 'Plans', id: 'plan'}
		]

		const currentMenu = _.findLast(topMenuOptions, el => matchPath(location.pathname, {path: `${match.url}/${el.id}`})) || {id: 'dashboard'}

		return <Container>
			<Dimmer active={openSideMenu} onClick={this.closeSidebar} className='sidemenu-dimmer' />
			<Modal
					open={showLoggedOut}
					header={t('login.kickAlert.header')}
					content={t('login.kickAlert.content')}
					actions={[
						{
							key: 'ok',
							content: t('login.kickAlert.ok'),
							primary: true,
							autoFocus: true,
							onClick: () => {this.props.history.push('/agent/login')}
						}
					]}
				/>
			<Menu secondary>
				<Menu.Item header>
					Lingtelli Agent Console
				</Menu.Item>
				{topMenuOptions.map(el => <Menu.Item active={el.id === currentMenu.id} key={el.id}>
					<Link to={`${match.path}/${el.id}`}>{el.text}</Link>
				</Menu.Item>)}
				<Menu.Menu position='right'>
					{user.paid_type &&
					<Menu.Item>
						<Label>{user.paid_type}</Label>
					</Menu.Item> }
					<Menu.Item>
						<a href='#' onClick={this.onLogout}>Logout</a>
					</Menu.Item>
				</Menu.Menu>
			</Menu>
			{messages.showing && <Message 
				error={messages.showing === 'error'}
				info={messages.showing === 'info'}
				size='small'
				className='global-message'
				floating
				compact
				onClick={hideAllMessages}>
				<Message.Content>{t(messages.message)}</Message.Content>
			</Message>}
			<Divider />
			{
				openDemoModal &&
					<DemoModal
						open={openDemoModal}
						closeModal={this.onCloseDemoModal}
					/>
			}
			{
				loading &&
					(<Dimmer active>
						<Loader content='Loading' size='large' />
					</Dimmer>)
			}
			<Switch>
				<Route location={location} path={`${match.path}/profile`} component={ProfilePage} />
				<Route location={location} path={`${match.path}/member`} exact component={MemberPage} />
				<Route location={location} path={`${match.path}/login`} component={LoginPage} />
				<Route location={location} path={`${match.path}/plan`} exact component={PlanPage} />
				<Route location={location} path={`${match.path}/plan/create`} component={CreatePlanPage} />
				<Route location={location} path={`${match.path}/member/:id`} exact component={TaskbotsPage} />
				<Route location={location} path={`${match.path}/taskbots`} exact component={TaskbotsPage} />
				<Route location={location} path={`${match.path}/templates`} exact component={TemplatesPage} />
				<Route location={location} path={`${match.path}/taskbots/create`} exact component={CreateTaskbotPage} />
				<Route location={location} path={`${match.path}/templates/create`} exact component={CreateTemplatePage} />
				<Route location={location} path={`${match.path}/taskbots/:id`} exact component={TaskbotDetailPage} />
				<Route location={location} path={`${match.path}/templates/:id`} exact component={TemplateDetailPage} />
				<Route render={props => <Redirect to={`${match.path}/member`} />} />
			</Switch>
		</Container>
	}
}

const mapStateToProps = (state, props) => ({
	messages: state.get('messages'),
	user: state.getIn(['agent', 'profile']),
	showLoggedOut: state.getIn(['user', 'showLoggedOut'])
})

export default compose(
	connect(mapStateToProps, {logout, fetchPackages, fetchAgent, hideAllMessages}),
	toJS,
	translate()
)(Dashboard)