import React, {Component} from 'react'
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
	Container,
	Divider,
	Message
} from 'semantic-ui-react'
import { Route, NavLink, withRouter, matchPath, Switch, Redirect} from 'react-router-dom'
import { fetchBot } from 'actions/bot'
import { hideAllMessages } from 'actions/message'
import LingBreadcrumbs from './LingBreadcrumbs'

import TilePage from './TilePage'
import BotListPage from './BotListPage'
import AboutPage from './AboutPage'
import CreateBotPage from './CreateBotPage'
import CreateFromTemplatePage from './CreateFromTemplatePage'
import toJS from 'components/utils/ToJS'

class NoSidePage extends Component {
	constructor(props) {
		super(props)
		this.state = {
			loading: false,
		}
	}

	changePath = (e, path) => {
		const {history} = this.props
		history.push(path.value)
	}

	render() {
		const { t, match, location, messages, hideAllMessages } = this.props
		return <div className='content-container large'>
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
				<Menu.Item>
					<LingBreadcrumbs t={t} pathname={location.pathname} />
				</Menu.Item>
			</Menu>
			<Divider />
			<Switch>
				<Route path={`/dashboard`} exact render={props => <TilePage {...props} onUpdate={this.updateBots} isUpdate={this.isUpdate} />} />
				<Route path={`/dashboard/account`} render={props => <Container text><AboutPage onResetPassword={this.onResetPassword} {...props} /></Container>} />
				<Route path={`/dashboard/bot/create`} render={props => <Container text><CreateBotPage {...props} /></Container>} />
				<Route path={`/dashboard/bot/fromTemplate`} render={props => <CreateFromTemplatePage {...props} />} />
				<Route render={props => <Redirect to='/' />} />
			</Switch>
		</div>
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
)(NoSidePage)