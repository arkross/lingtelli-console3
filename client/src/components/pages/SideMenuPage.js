import React from 'react';
import _ from 'lodash'
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { translate } from 'react-i18next';
import { NavLink, Link } from 'react-router-dom'
import { fetchAllBotDetails, fetchPlatforms } from 'actions/bot';
import { Icon, Menu, Image, Label } from 'semantic-ui-react';
import logo from 'styles/img/logo.png'

import toJS from 'components/utils/ToJS';

class SideMenuPage extends React.Component {
	items = <div />;

	state = {
		openModal: false,
		loading: false,
		target: '',
		errors: ''
	}

	componentDidMount() {
	}

	onCreateBot = () => {
		this.onBotItemClick()
		this.props.history.push(`${this.props.match.url}/bot/create`)
		// this.setState({ openModal: true });
	}

	handleDashboardClick = () => {
		this.onBotItemClick()
		const { match } = this.props
		this.props.history.push(`${match.url}`)
	}

	handleAccountClick = () => {
		this.onBotItemClick()
		const { match } = this.props
		this.props.history.push(`${match.url}/account`)
	}

	onCloseBot = () => {
		this.setState({ openModal: false });
		this.props.fetchAllBotDetails(this.props.user.paid_type)
			.catch( err => {
				this.setState({ errors: err.message });
			});
	}

	onBotItemClick = () => {
		return this.props.onItemClick()
	}

	componentWillReceiveProps(nextProps) {
		const { bots, match, t } = nextProps;
		if (bots) {
			this.items = _.map(bots, (item) => (
				<div onClick={this.onBotItemClick} key={`bot${item.id}`} className=''>
					<NavLink to={`${match.url}/bot/${item.id}`} className='item' key={`bot${item.id}`}>
						{item.robot_name} {item.bot_type === 'TASK' ? <Label content={t('menu.task')} /> : ''}
					</NavLink>
				</div>
			))
		}
	}

	render = () => {
		const leftIconStyle = {
			margin: '0 15px 0 0'
		}

		const { t, bots, match } = this.props;

		return (
			<Menu fixed='left' vertical inverted color='brown' size='large'>
				<Menu.Item onClick={this.handleDashboardClick}>
					<span className='header'> <Image src={logo} size='mini' inline/> Lingtelli Bot Console</span>
				</Menu.Item>
				<Menu.Item>
					<Menu.Header name='bot'>
						<span>
							{t('menu.bot')}
							<Icon name='plus' onClick={this.onCreateBot} className='rightIconStyle clickable' />
						</span>
					</Menu.Header>
					<Menu.Menu size='large'>
						{!!bots && this.items}
					</Menu.Menu>
				</Menu.Item>
				<Menu.Item onClick={this.handleAccountClick}>
					<span id='account'>
						<span>
							<Icon name='user' style={leftIconStyle} />
							{t('menu.account')}
						</span>
					</span>
				</Menu.Item>
				<Menu.Item onClick={this.props.logout}>
					<span>
						<Icon name='power' style={leftIconStyle} />
						{t('menu.logout')}
					</span>
				</Menu.Item>
			</Menu>
		)
	};
}

SideMenuPage.propTypes = {
	logout: PropTypes.func.isRequired,
	fetchAllBotDetails: PropTypes.func.isRequired
}

const mapStateToProps = (state) => ({
	user: state.get('user'),
	bots: state.getIn(['bot', 'bots']).filter(el => el.get('id')) || {},
	info: state.getIn(['bot', 'info']) || {},
});

export default compose(
	translate('translations'),
	connect(mapStateToProps, { fetchAllBotDetails }),
	toJS
)(SideMenuPage);
