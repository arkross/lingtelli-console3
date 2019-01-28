import { Component } from 'react'
import React from 'react'
import { translate } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Header, Icon } from 'semantic-ui-react'

class NotFound extends Component {
	render() {
		const { t } = this.props
		return <Header as='h1' icon textAlign='center'>
			<Icon name='question' />
			<Header.Content>
				{t('errors.global.page_not_found')}
			</Header.Content>
			<Header.Subheader>
				{t('errors.global.go_back')}: <Link to='/'>{t('menu.dashboard')}</Link>
			</Header.Subheader>
		</Header>
	}
}

export default translate()(NotFound)