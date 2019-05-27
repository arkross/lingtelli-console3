import React, {Component, Fragment} from 'react'
import _ from 'lodash'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import {
	Menu,
	Responsive,
	Dropdown,
	Segment,
	Label,
	Grid,
	Dimmer,
	Container,
	Divider,
	Icon,
	Message,
	Sidebar
} from 'semantic-ui-react'
import { Route, NavLink, withRouter, matchPath, Switch, Redirect} from 'react-router-dom'
import { fetchBot } from 'actions/bot'
import { hideAllMessages } from 'actions/message'
import LingBreadcrumbs from './LingBreadcrumbs'
import BotConfigPage from './BotConfigPage';
import AnalysisPage from './AnalysisPage';
import HistoryPage from './HistoryPage';
import RecomLogPage from './RecomLogPage'
import FAQConfigPage from './FAQConfigPage';
import toJS from 'components/utils/ToJS'
import TestBotPage from './TestBotPage';
import BatchTestPage from './BatchTestPage'
import ThirdPartyIntegrationPage from '../ThirdPartyIntegrationPage'
import FBIntegrationPage from './FBIntegrationPage'
import LineIntegrationPage from './LineIntegrationPage'
import WebIntegrationPage from './WebIntegrationPage'
import APIIntegrationPage from './APIIntegrationPage'

class ContentPage extends Component {
	constructor(props) {
		super(props)
		this.state = {
			loading: false,
			openSideMenu: false,
			scale: 7
		}
	}

	toggleSidebar = () => {
		this.setState({ openSideMenu: ! this.state.openSideMenu })
	}

	closeSidebar = () => {
		this.setState({ openSideMenu: false })
	}

	changePath = (e, path) => {
		const {history} = this.props
		history.push(path.value)
		this.closeSidebar()
	}

	render() {
		const { t, match, location, info, user, hideAllMessages, messages } = this.props;
		const { loading, openSideMenu } = this.state;

		const isHidden = user.paid_type === 'Staff' && !!info.assign_user
		const isTask = info.bot_type === 'TASK'

		const subMenus = [
			{ text: t('chatbot.setting.text') , id: 'setting'},
			{ text: t('chatbot.integration.thirdParty') , id: 'integration/thirdparty', hide: isHidden},
			{ text: t('chatbot.integration.web') , id: 'integration/web'},
			{ text: t('chatbot.integration.api') , id: 'integration/api'},
			{ text: t('chatbot.analysis.text'), id: 'analysis' },
			{ text: t('chatbot.faq.text'), id: 'faq', hide: isTask },
			{ text: t('chatbot.test.text'), id: 'test'}
		]
		.filter(el => !el.hide)
		.map(el => Object.assign({value: `${match.url}/${el.id}`, key: el.id}, el))

		const menuChildren = <Fragment>
			<NavLink className='item header' to={`/dashboard/bot/${info.id}`}>
				{info.robot_name}
			</NavLink>
			<Menu.Item>
				<Menu.Header>{t('chatbot.analysis.title')}</Menu.Header>
				<Menu.Menu>
					<NavLink className='item' onClick={this.closeSidebar} to={`/dashboard/bot/${info.id}/analysis`}>
						{t('chatbot.analysis.text')}
					</NavLink>
					<NavLink className='item' onClick={this.closeSidebar} to={`/dashboard/bot/${info.id}/history`}>
						{t('chatbot.history.text')}
					</NavLink>
					<NavLink className='item' onClick={this.closeSidebar} to={`/dashboard/bot/${info.id}/recommendations`}>
						{t('chatbot.recommendations.text')}
					</NavLink>
				</Menu.Menu>
			</Menu.Item>
			<Menu.Item>
				<Menu.Header>{t('chatbot.faq.title')}</Menu.Header>
				<Menu.Menu>
					{isTask ? '' : <NavLink className='item' onClick={this.closeSidebar} to={`/dashboard/bot/${info.id}/faq`}>{t('chatbot.faq.text')}</NavLink>}
					<NavLink className='item' onClick={this.closeSidebar} to={`/dashboard/bot/${info.id}/test`}>{t('chatbot.test.text')}</NavLink>
					<NavLink className='item' onClick={this.closeSidebar} to={`/dashboard/bot/${info.id}/batch`}>{t('chatbot.batch.text')}</NavLink>
				</Menu.Menu>
			</Menu.Item>
			<Menu.Item>
				<Menu.Header>{t('chatbot.setting.title')}</Menu.Header>
				<Menu.Menu>
					<NavLink className='item' onClick={this.closeSidebar} to={`/dashboard/bot/${info.id}/setting`}>{t('chatbot.setting.general')}</NavLink>
					{ isHidden ? '' : <NavLink className='item' onClick={this.closeSidebar} to={`/dashboard/bot/${info.id}/integration/facebook`}>{t('chatbot.integration.facebook')}</NavLink>}
					{ isHidden ? '' : <NavLink className='item' onClick={this.closeSidebar} to={`/dashboard/bot/${info.id}/integration/line`}>{t('chatbot.integration.line')}</NavLink>}
					<NavLink className='item' onClick={this.closeSidebar} to={`/dashboard/bot/${info.id}/integration/web`}>{t('chatbot.integration.web')}</NavLink>
					<NavLink className='item' onClick={this.closeSidebar} to={`/dashboard/bot/${info.id}/integration/api`}>{t('chatbot.integration.api')}</NavLink>
				</Menu.Menu>
			</Menu.Item>
		</Fragment>

		return <Container fluid className='bot-page new-bot-page'>
			<Responsive as={Fragment} minWidth={Responsive.onlyComputer.minWidth}>
				<Sidebar direction='left' as={Menu} vertical color='black' fixed='left' className='sidebar-menu' inverted visible={true} animation='overlay' children={menuChildren} />
			</Responsive>
			<Responsive as={Fragment} maxWidth={Responsive.onlyTablet.maxWidth}>
				<Sidebar direction='left' visible={openSideMenu} animation='overlay' className='sidebar-menu' fixed='left' as={Menu} vertical color='black' inverted onHide={this.closeSidebar} children={menuChildren} />
			</Responsive>
			
			{/* <Menu vertical fixed='left' color='black' inverted className={`sidebar-menu ${openSideMenu ? 'active' : ''}`}> */}
				
			<Sidebar.Pusher dimmed={openSideMenu} className='content-container large'>
				{messages.showing && <Message 
					error={messages.showing === 'error'}
					info={messages.showing === 'info'}
					success={messages.showing === 'success'}
					size='small'
					className='global-message'
					floating
					onClick={hideAllMessages}
					onDismiss={hideAllMessages}>
					<Message.Content>{t(messages.message)}</Message.Content>
				</Message>}
				<Menu secondary className='content-top'>
					<Responsive as={Menu.Item} maxWidth={Responsive.onlyComputer.minWidth} icon='bars' onClick={this.toggleSidebar} />
					<Menu.Item>
						<LingBreadcrumbs t={t} pathname={location.pathname} />
					</Menu.Item>
				</Menu>
				<Divider />
				{/* <Dimmer active={openSideMenu} onClick={this.closeSidebar} className='sidemenu-dimmer' /> */}
				<Switch>
					<Route path={`${match.path}/`} exact render={props => <AnalysisPage className='content-container large' loading={loading} {...props} />} />
					<Route path={`${match.path}/setting`} render={props => <BotConfigPage {...props} />} />
					<Route path={`${match.path}/faq`} render={props => <FAQConfigPage {...props} />} />
					<Route path={`${match.path}/analysis`} exact render={props => <AnalysisPage className='content-container large' loading={loading} {...props} />} />
					<Route path={`${match.path}/history`} render={props => <HistoryPage className='content-container large' {...props} />} />
					<Route path={`${match.path}/analysis/history`} render={props => <Redirect to={`/dashboard/bot/${info.id}/history`} />} />
					<Route path={`${match.path}/analysis/recommendations`} render={props => <Redirect to={`/dashboard/bot/${info.id}/recommendations`} />} />
					<Route path={`${match.path}/recommendations`} render={props => <RecomLogPage className='content-container large' {...props} />} />
					<Route path={`${match.path}/test`} render={props => <TestBotPage {...props} />} />
					<Route path={`${match.path}/batch`} render={props => <BatchTestPage {...props} />} />
					<Route path={`${match.path}/integration/thirdparty`} render={props => <ThirdPartyIntegrationPage {...props} />} />
					<Route path={`${match.path}/integration/facebook`} render={props => <FBIntegrationPage {...props} />} />
					<Route path={`${match.path}/integration/line`} render={props => <LineIntegrationPage {...props} />} />
					<Route path={`${match.path}/integration/web`} render={props => <WebIntegrationPage {...props} />} />
					<Route path={`${match.path}/integration/api`} render={props => <APIIntegrationPage {...props} />} />
					<Route render={props => <Redirect to='/' />} />
				</Switch>
			</Sidebar.Pusher>
		</Container>
	}
}

const mapStateToProps = (state, props) => ({
	user: state.get('user'),
	messages: state.get('messages'),
	info: state.getIn(['bot', 'bots', props.match.params.id]) || {}
})

export default compose(
	translate('translations'),
	withRouter,
	connect(mapStateToProps, {fetchBot, hideAllMessages}),
	toJS
)(ContentPage)