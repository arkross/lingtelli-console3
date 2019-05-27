import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import { Route, Switch, Redirect, NavLink } from 'react-router-dom'
import { translate } from 'react-i18next';
import _ from 'lodash'
import { logout } from 'actions/auth';
import { fetchDetail, fetchPackages } from 'actions/user'
import { fetchAllBotDetails, fetchBot, fetchHistory, fetchPlatforms } from 'actions/bot';
import { hideAllMessages } from 'actions/message'
import { Dimmer, Loader, Dropdown, Menu, Divider, Container, Message, Icon, Label, Responsive, Modal} from 'semantic-ui-react';
import PropTypes from 'prop-types';
import LingBreadcrumbs from 'components/utils/LingBreadcrumbs'
import SideMenuPage from './SideMenuPage';
import ContentPage from './ContentPage';
import AboutPage from './AboutPage';
import TilePage from './TilePage'
import CreateBotPage from './CreateBotPage'
import toJS from 'components/utils/ToJS'
import setAuthorizationHeader from 'utils/setAuthorizationHeader'

import DemoModal from 'components/modals/DemoModal';

const options = [
	{ key: 'en', text: 'English', value: 'en-US' },
	{ key: 'cn', text: '简体中文', value: 'zh-CN' },
	{ key: 'tw', text: '繁體中文', value: 'zh-TW' },
];

class DashBoardPage extends React.Component {
	isUpdate = false

	state = {
		loading: false,
		openDemoModal: false,
		activeItem: 'account',
		openSideMenu: false
	}

	onResetPassword = () => {
		window.location.reload()
	}

	logout = () => {
		this.props.logout().then(() => {
			this.props.history.push('/login')
		})
	}

	componentDidMount() {
		const token = localStorage.getItem('token')
		setAuthorizationHeader(token)
		this.props.fetchDetail().then(() => {
			this.updateBots()
			this.props.fetchPlatforms()
			this.props.fetchPackages()
			this.isUpdate = true
		})
	}

	componentDidUpdate() {
	}

	updateBots = () => {
		return this.props.fetchAllBotDetails(this.props.user.paid_type)
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

	render = () => {
		const { loading, openDemoModal, openSideMenu } = this.state;
		const { t, match, location, history, messages, hideAllMessages, user } = this.props

		let dropdownText = _.find(options, el => el.value === localStorage.getItem('i18nextLng'))
		if ( ! dropdownText) {
			dropdownText = options[0]
		}

		return (
			<div className='dashboard-container'>
				<Modal
					open={user.showLoggedOut}
					header={t('login.kickAlert.header')}
					content={t('login.kickAlert.content')}
					actions={[
						{
							key: 'ok',
							content: t('login.kickAlert.ok'),
							positive: true,
							autoFocus: true,
							onClick: this.onResetPassword
						}
					]}
				/>
				<div className={`leftmenu-container ${openSideMenu ? 'active' : ''}`}>
					<SideMenuPage match={match} history={history} logout={this.logout} onItemClick={this.handleItemClick} />
				</div>
				<div className='rightcontent-container'>
					<Dimmer active={openSideMenu} onClick={this.closeSidebar} className='sidemenu-dimmer' />
					<Menu secondary>
						<Menu.Item className='leftmenu-switch'>
							<Icon name='bars' link onClick={this.toggleSidebar} />
						</Menu.Item>
						<Menu.Item>
							<Responsive as={LingBreadcrumbs} t={t} pathname={location.pathname} />
						</Menu.Item>
						<Menu.Menu position='right'>
							<Menu.Item>
								<Dropdown text={user.username}>
									<Dropdown.Menu>
										<NavLink className='item' role='option' to='/dashboard/account'>
											<span className='text'>{t('menu.account')}</span>
											<span className='description'>{user.paid_type}</span>
										</NavLink>
										<Dropdown.Divider />
										<Dropdown.Header content={t('chatbot.selectLanguage')} icon='world' />
										{options.map(el => <Dropdown.Item key={el.key} content={el.text} onClick={this.onLanguageChanged.bind(null, null, { value: el.value })} active={el.value === localStorage.getItem('i18nextLng')} />)}
										<Dropdown.Divider />
										
										<Dropdown.Item text={t('menu.logout')} onClick={this.logout} />
									</Dropdown.Menu>
								</Dropdown>
							</Menu.Item>
							
						</Menu.Menu>
					</Menu>
					{messages.showing && <Message 
						error={messages.showing === 'error'}
						info={messages.showing === 'info'}
						success={messages.showing === 'success'}
						size='small'
						className='global-message'
						floating
						compact
						onClick={hideAllMessages}
						onDismiss={hideAllMessages}>
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
					<Container fluid>
						<Switch>
							<Route path={match.path} exact render={props => <TilePage {...props} onUpdate={this.updateBots} isUpdate={this.isUpdate} />} />
							<Route path={`${match.path}/account`} render={props => <Container text><AboutPage onResetPassword={this.onResetPassword} {...props} /></Container>} />
							<Route path={`${match.path}/bot/:id([0-9]*)`} render={props => <ContentPage onUpdate={this.updateBots} onOpenDemoModal={this.onOpenDemoModal} {...props}/>} />
							<Route path={`${match.path}/bot/create`} render={props => <Container text><CreateBotPage {...props} /></Container>} />
							<Route render={props => <Redirect to='/' />} />
						</Switch>
					</Container>
				</div>
			</div>
		)
	}
}

DashBoardPage.propTypes = {
	fetchBot: PropTypes.func.isRequired,
	fetchDetail: PropTypes.func.isRequired,
	logout: PropTypes.func.isRequired,
	history: PropTypes.shape({
		push: PropTypes.func.isRequired
	})
}

const mapStateToProps = (state) => ({
	user: state.get('user'),
	messages: state.get('messages')
})

export default compose(
	translate('translations'),
	connect(mapStateToProps, { logout, fetchBot, fetchHistory, fetchDetail, fetchAllBotDetails, fetchPlatforms, hideAllMessages, fetchPackages }),
	toJS
)(DashBoardPage);
