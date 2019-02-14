import React, {Component} from 'react'
import { Grid, Header, Icon, Label } from 'semantic-ui-react'
import { compose } from 'recompose';
import { translate } from 'react-i18next'
import EditableText from '../utils/EditableText';
import {connect} from 'react-redux'
import _ from 'lodash'
import { updateBot } from 'actions/bot'
import toJS from 'components/utils/ToJS'
import { Link } from 'react-router-dom'

class BasicSettingsWidget extends Component {
	onChange = (key, val) => {
		const { info: { robot_name, greeting_msg, failed_msg, postback_title, postback_activate }} = this.props
		return this.props.updateBot(this.props.match.params.id, Object.assign({
			robot_name,
			greeting_msg,
			failed_msg,
			postback_title,
			postback_activate
		}, {[key]: val}))
	}
	render = () => {
		const { t, info: {third_party, robot_name, failed_msg, greeting_msg, platform: botPlatforms}, supportPlatforms } = this.props
		const currentPlatforms = _.filter(supportPlatforms, plat => _.find(third_party, p => p == plat.id))
		const platformsArray = _.map(supportPlatforms, platform => ({
			name: platform.name,
			active: (currentPlatforms ? currentPlatforms.find(p => p.id === platform.id) : false),
			id: platform.id
		}))
		return <Grid divided='vertically'>
			<Grid.Row columns={2}>
				<Grid.Column>
					<Header as='h3'>
						{t('chatbot.setting.text')}
					</Header>
				</Grid.Column>
				<Grid.Column textAlign='right'>
					<Link to={`${this.props.location.pathname}/setting`}>{t('chatbot.tile.detail')}</Link>
				</Grid.Column>
			</Grid.Row>
			<Grid.Row stretched> 
				<Grid.Column>
					<Grid>
						<Grid.Row columns={2} verticalAlign='middle'>
							<Grid.Column width={6}>
								{t('chatbot.name')}
							</Grid.Column>
							<Grid.Column width={10}>
								<EditableText as='div' value={robot_name} onChange={this.onChange.bind(this, 'robot_name')} placeholder={t('chatbot.placeholder.name')}/>
							</Grid.Column>
						</Grid.Row>
						<Grid.Row columns={2} verticalAlign='middle'>
							<Grid.Column width={6}>
								{t('chatbot.greetingMsg')}
							</Grid.Column>
							<Grid.Column width={10}>
								<EditableText as='div' value={greeting_msg} onChange={this.onChange.bind(this, 'greeting_msg')} placeholder={t('chatbot.placeholder.greetingMsg')} />
							</Grid.Column>
						</Grid.Row>
						<Grid.Row columns={2} verticalAlign='middle'>
							<Grid.Column width={6}> 
								{t('chatbot.failedMsg')}
							</Grid.Column>
							<Grid.Column width={10}>
								<EditableText as='div' value={failed_msg} onChange={this.onChange.bind(this, 'failed_msg')} placeholder={t('chatbot.placeholder.failedMsg')} />
							</Grid.Column>
						</Grid.Row>
					</Grid>
				</Grid.Column>
			</Grid.Row>
			<Grid.Row> 
				<Grid.Column stretched>
					<Label.Group>
					{_.map(platformsArray, p => 
						<Label key={p.name} color={p.active ? 'green' : 'grey'}>
							{p.active && <Icon name='check' />}
							{!p.active && <Icon name='broken chain' />}
							{p.name} 
						</Label>
					)}
					</Label.Group>
				</Grid.Column>
			</Grid.Row>
		</Grid>
	}
}

const mapStateToProps = (state, ownProps) => ({
	info: state.getIn(['bot', 'bots', ownProps.match.params.id + '']) || {},
	supportPlatforms: state.getIn(['bot', 'supportPlatforms'])
})

export default compose(
	translate(),
	connect(mapStateToProps, {updateBot}),
	toJS
)(BasicSettingsWidget)
