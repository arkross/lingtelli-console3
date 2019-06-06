import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { compose } from 'recompose'
import { Route, Switch, Redirect, NavLink } from 'react-router-dom'
import { translate } from 'react-i18next'
import _ from 'lodash'
import toJS from '../../utils/ToJS'
import { Menu, Image, Container, Dropdown, Input, Modal, Label, Loader, Dimmer, Responsive } from 'semantic-ui-react'
import { fetchAllBotDetails, fetchPlatforms } from '../../../actions/bot'
import { fetchDetail, fetchPackages, fetchAllTemplateDetails } from '../../../actions/user'
import { logout } from '../../../actions/auth'
import logo from 'styles/img/logo.png'
import NoSidePage from './NoSidePage'
import ContentPage from './ContentPage'

class DashboardPage extends Component {
	constructor(props) {
		super(props)
		this.state = {
			searchBot: '',
			bots: {},
			pageLoading: true,
			showFailModal: false
		}
	}

	async componentDidMount() {
		try {
			await this.props.fetchDetail()
			await this.props.fetchPlatforms()
			await this.props.fetchPackages()
			await this.props.fetchAllTemplateDetails()
			await this.props.fetchAllBotDetails(this.props.user.paid_type)
			this.searchBots('')
			this.setState({ pageLoading: false })
		} catch (err) {
			this.setState({
				showFailModal: true
			})
		}
	}

	searchBots = keyword => {
		this.setState({
			searchBot: keyword,
			bots: keyword
				? _.filter(this.props.bots, bot => bot.robot_name.toLowerCase().indexOf((keyword || this.state.searchBot).toLowerCase()) > -1)
				: this.props.bots
		})
	}

	handleRefresh = () => {
		window.location.reload()
	}

	handleSearchChange = (e, { value }) => {
		this.searchBots(value)
	}

	handleDashboardClick = () => {
		this.props.history.push(`${this.props.match.url}`)
	}

	handleBotClick = id => {
		this.props.history.push(`${this.props.match.url}/bot/${id}`)
	}

	handleLanguageSelected = (e, { value }) => {
		const { i18n } = this.props
		i18n.changeLanguage(value)
	}

	handleLogoutClick = () => {
		this.props.logout().then(() => {
			this.props.history.push('/login')
		})
	}

	render() {
		const { user, t, match, messages } = this.props
		const { bots, searchBot, pageLoading, showFailModal } = this.state

		const languageOptions = [
			{ key: 'en', text: 'English', value: 'en-US' },
			{ key: 'cn', text: '简体中文', value: 'zh-CN' },
			{ key: 'tw', text: '繁體中文', value: 'zh-TW' },
		]

		return <div className='dashboard-container' style={{paddingTop: '48px'}}>
			<Modal
				open={user.showLoggedOut}
				header={t('login.kickAlert.header')}
				content={t('login.kickAlert.content')}
				actions={[
					{
						key: 'ok',
						content: t('login.kickAlert.ok'),
						primary: true,
						autoFocus: true,
						onClick: this.handleRefresh
					}
				]}
			/>
			{!pageLoading ? <Fragment><Menu fixed='top' inverted style={{ zIndex: '1003' }}>
				<Menu.Item header onClick={this.handleDashboardClick}>
					<Image src={logo} size='mini' inline /><Responsive minWidth={Responsive.onlyTablet.minWidth}>LingBot Console</Responsive>
				</Menu.Item>
				
				<Dropdown text={t('menu.bot')} labeled item>
					<Dropdown.Menu>
						<Input placeholder='Search..' icon='search' onClick={e => e.stopPropagation()} value={searchBot} onChange={this.handleSearchChange} autoFocus ref={el => {this.searchBotInput = el}} />
						<Dropdown.Menu scrolling>
						{
							_.map(bots, bot => <Dropdown.Item key={bot.id} content={bot.robot_name} description={bot.bot_type === 'TASK' ? t('menu.task') : null} onClick={this.handleBotClick.bind(null, bot.id)} />)
						}
						</Dropdown.Menu>
					</Dropdown.Menu>
				</Dropdown>
				<Dropdown text={t('menu.new.title')} labeled item>
					<Dropdown.Menu>
						<NavLink className='item' to='/dashboard/bot/create'>{t('menu.new.botManual')}</NavLink>
						<NavLink className='item' to='/dashboard/bot/fromTemplate'>{t('menu.new.botTemplate')}</NavLink>
					</Dropdown.Menu>
				</Dropdown>
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
								{languageOptions.map(el => <Dropdown.Item key={el.key} content={el.text} onClick={this.handleLanguageSelected.bind(null, null, { value: el.value })} active={el.value === localStorage.getItem('i18nextLng')} />)}
								<Dropdown.Divider />
								
								<Dropdown.Item text={t('menu.logout')} onClick={this.handleLogoutClick} />
							</Dropdown.Menu>
						</Dropdown>
					</Menu.Item>
				</Menu.Menu>
			</Menu>
			<Switch>
				<Route path={match.path} exact render={props => <NoSidePage {...props} />} />
				<Route path={`${match.path}/account`} render={props => <NoSidePage {...props} />} />
				<Route path={`${match.path}/bot/:id([0-9]*)`} render={props => <ContentPage onUpdate={this.updateBots} onOpenDemoModal={this.onOpenDemoModal} {...props}/>} />
				<Route path={`${match.path}/bot/create`} render={props => <NoSidePage {...props} />} />
				<Route path={`${match.path}/bot/fromTemplate`} render={props => <NoSidePage {...props} />} />
				<Route render={props => <Redirect to='/' />} />
			</Switch>
		</Fragment> : <Container>
				<Modal
					open={showFailModal}
					header={t('loader.failure.header')}
					content={t('loader.failure.content')}
					actions={[
						{
							key: 'ok',
							content: t('login.kickAlert.ok'),
							primary: true,
							autoFocus: true,
							onClick: this.handleRefresh
						}
					]}
				/>
				<Loader active={pageLoading} content={t('loader.fetching')} size='large' />
		</Container>}
		</div>
	}
}

const mapStateToProps = (state, props) => ({
	bots: state.getIn(['bot', 'bots']),
	user: state.get('user'),
	messages: state.get('messages')
})

export default compose(
	connect(mapStateToProps, { fetchDetail, fetchAllBotDetails, fetchPackages, fetchPlatforms, fetchAllTemplateDetails, logout }),
	translate(),
	toJS
)(DashboardPage)