import React from 'react'
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { translate, Trans } from 'react-i18next';
import {
	Form,
	Icon,
	Label,
	Button,
	Checkbox,
	Segment,
	Divider,
	Message,
	Modal,
	Grid
} from 'semantic-ui-react';
import { withRouter, NavLink } from 'react-router-dom'
import toJS from 'components/utils/ToJS'
import DeletionModal from '../modals/DeletionModal'

class BotConfigForm extends React.Component {

	state = {
		info: this.props.info,
		errors: {},
		loading: false,
		openDeleteModal: false,
		openModal: { type: null, open: false }
	}

	componentWillReceiveProps(nextProps) {
		this.setState({ info: nextProps.info });
	}

	// CreateBotForm: deploy platform listener
	onPlatformSelect = (e, { platformid, name }) => {
		const { platform } = this.state.info;
		const activatedPlatforms  = (this.state.info && this.state.info.platform) ? this.state.info.platform : []
		const checked = activatedPlatforms.indexOf(platformid) > -1

		if ( ! checked) {
			this.setState({
				info: {
					...this.state.info,
					platform : [...platform, platformid]
				},
				openModal: { type: name, open: true }
			});
		} else {
			this.removePlatformElement(platformid); // hack
		}
	}
	// Wanna remove elements and render UI both.
	removePlatformElement = (id) => {
		const { platform } = this.state.info;
		this.setState({
			info: {
				...this.state.info,
				platform: platform.filter( platformId => platformId!==id)
			}
		})
	}

	validate = () => {
		const errors = {}
		const { robot_name } = this.state.info;

		if(!robot_name || robot_name.trim().length===0)
			errors.robot_name = this.props.t('errors.robotName.blank');

		return errors
	}

	onChange = (e, {name, value}) => {
		this.setState({
			 info: { ...this.state.info, [name]: value }
		})
	}

	onUpdate = (e) => {
		const { activeBot } = this.props.info
		const { info } = this.state
		const errors = this.validate()
		this.setState({errors})
		if (Object.keys(errors).length === 0) {
			this.props.onUpdate(activeBot, info)
		}
	}

	onOpenDeleteModal = e => {
		this.setState({openDeleteModal: true})
	}

	onCloseDeleteModal = e => {
		this.setState({openDeleteModal: false})
	}

	onDelete = (e) => {
		const { activeBot } = this.props.info
		this.props.onDelete(activeBot)
	}

	onCloseModal = () => {
		this.setState({ openModal: { open: false } })
	}

	createIntegrations = () => {
		const { supportPlatforms, t } = this.props;
		const activatedPlatforms  = (this.state.info && this.state.info.platform) ? this.state.info.platform : [];

		const platformIconMap = {
			'Facebook': 'facebook',
			'Line': 'chat',
			'Web': 'globe'
		}

		const platformHeader = {
			width: '100%',
			fontSize: '50px',
			margin: '10px 0 5px 0',
			textAlign: 'center',
			padding: '5px'
		}

		const platformContent = {
			witdth: '100%',
			fontSize: '20px',
			textAlign: 'center',
			marginBottom: '40px'
		}

		const platformTrigger = {
			width: '100%',
			textAlign: 'center'
		}

		const platformColor = {
			Facebook: 'facebook',
			Line: 'green',
			Web: 'teal'
		}

		return supportPlatforms.map( platform => (
			<Segment key={platform.id}>
				<div>
					<div>
						<div style={platformHeader}>
							<Icon
								name={platformIconMap[platform.name]}
								color={platformColor[platform.name]}
								style={{ cursor: 'pointer' }}
								onClick={ () => { this.setState({openModal: { type: platform.name, open: true }})}}
							/>
						</div>
						<div style={platformContent}>
							{platform.name}
						</div>
					</div>
					<div style={platformTrigger}>
						<Button
							name={platform.name}
							platformid={platform.id}
							onClick={this.onPlatformSelect}
							color={activatedPlatforms.indexOf(platform.id) > -1 ? 'green' : 'grey'}
							icon={activatedPlatforms.indexOf(platform.id) > -1 ? 'check' : 'remove'}
							content={activatedPlatforms.indexOf(platform.id) > -1 ? t('chatbot.integration.activated') : t('chatbot.integration.inactive')}
						/>
					</div>
				</div>
			</Segment>
		));
	}

	render = () => {
		const { t, loading, showSuccess, match, user } = this.props;
		const { info, openModal, openDeleteModal } = this.state;

		return (
			<Form success={showSuccess} loading={loading} className='bot-config-container' style={{padding: '15px', overflow: 'auto'}}>
				<Message success><p>{t('chatbot.success')}</p></Message>
				<Form.Field>
					<Form.Input
						label={t('chatbot.name')}
						size='large'
						type='text'
						name='robot_name'
						maxLength={15}
						onChange={this.onChange}
						value={info.robot_name|| ''}>
					</Form.Input>
					<Form.Input
						label={t('chatbot.greetingMsg')}
						size='large'
						type='text'
						name='greeting_msg'
						maxLength={50}
						placeholder='greeting'
						onChange={this.onChange}
						value={info.greeting_msg || ''}>
					</Form.Input>
				</Form.Field>
				<Form.Field>
					<Form.Input
						label={t('chatbot.failedMsg')}
						size='large'
						type='text'
						name='failed_msg'
						maxLength={50}
						placeholder='failed'
						onChange={this.onChange}
						value={info.failed_msg || ''}>
					</Form.Input>
				</Form.Field>
				<Form.Field>
					<Form.Input
						label={t('chatbot.postbackMsg')}
						size='large'
						type='text'
						name='postback_title'
						maxLength={50}
						placeholder='postback'
						onChange={this.onChange}
						value={info.postback_title || ''}>
					</Form.Input>
				</Form.Field>
				<Label><Icon name='globe' />{t(`chatbot.language.${info.language}`)}</Label>
				<Divider />
				<Grid>
					<Grid.Row>
						<Grid.Column>
							{!(info.assign_user && user.paid_type === 'Staff') && <NavLink className='ui button facebook large' to={`/dashboard/bot/${match.params.id}/integration/facebook`}><Icon name='facebook' /> {t('chatbot.integration.facebook')}</NavLink>}
							{!(info.assign_user && user.paid_type === 'Staff') && <NavLink className='ui button green large' to={`/dashboard/bot/${match.params.id}/integration/line`}><Icon name='chat' /> {t('chatbot.integration.line')}</NavLink>}
							<NavLink className='ui button teal large' to={`/dashboard/bot/${match.params.id}/integration/web`}><Icon name='globe' /> {t('chatbot.integration.web')}</NavLink>
						</Grid.Column>
					</Grid.Row>
					<Grid.Row columns={2}>
						<Grid.Column floated='right'>
							<Button floated='right' primary onClick={this.onUpdate}>
								<Icon name='save' />
								{t('chatbot.update')}
							</Button>
							{info.bot_type === 'TASK' ? '' :
							<Button size='small' onClick={this.onOpenDeleteModal} negative floated='right'>
								<Icon name='trash alternate outline' />
								{t('chatbot.delete.button')}
							</Button>}
						</Grid.Column>
					</Grid.Row>
				</Grid>
				{ info.bot_type === 'TASK' ? '' :
				<DeletionModal
					title={t('chatbot.delete.title')}
					open={openDeleteModal}
					onClose={this.onCloseDeleteModal}
					onSuccess={this.onDelete}
					message={<Trans i18nKey='chatbot.delete.warning'><strong>{info.robot_name}</strong></Trans>}
					buttonText={t('chatbot.delete.title')}
					botId={info.id}
				/>}
			</Form>
		)
	}
}

const mapStateToProps = (state, ownProps) => ({
	user: state.get('user'),
	info: state.getIn(['bot', 'bots', ownProps.match.params.id + '']) || {},
	supportPlatforms: state.getIn(['bot', 'supportPlatforms'])
})

export default compose(
	translate('translations'),
	withRouter,
	connect(mapStateToProps),
	toJS
)(BotConfigForm);
