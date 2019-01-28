import React from 'react';
import PropTypes from 'prop-types'
import WebForm from 'components/forms/WebForm';
import { compose } from 'recompose';
import { translate } from 'react-i18next';
import { connect } from 'react-redux';
import {
	Modal,
} from 'semantic-ui-react'
import toJS from 'components/utils/ToJS'

class WebSettingModal extends React.Component {

	state = {
		loading: false,
		errors: {},
		platform: this.props.platform
	}

	activate = () => {
		const { platform } = this.state;
		const { supportPlatforms } = this.props;
	
		const ix = supportPlatforms.map(item=>item.name==='Web').indexOf(true);
	
		return platform.indexOf(ix+1)>=0;
	  }

	onClose = () => {
		// clear the errors state
		this.setState({ errors: {} });
		this.props.onCloseModal();
	}

	render = () => {
		const { open, t, match } = this.props;
		const { loading } = this.state;

		return (
			<Modal open={open} onClose={this.onClose} closeIcon closeOnDimmerClick={!loading}>
				<Modal.Header>{t('chatbot.setting.web.title')}</Modal.Header>
				<Modal.Content style={{marginTop: '10px', fontSize: '15px'}} scrolling>
					<p style={{ whiteSpace: 'pre-line' }} >
						{t('chatbot.setting.web.description')}
					</p>
					<WebForm match={match} active={!loading} isActivated={this.activate()} />
				</Modal.Content>
			</Modal>
		)
	}
}

WebSettingModal.propTypes = {
	open: PropTypes.bool.isRequired,
}

const mapStateToProps = (state, props) => ({
	activeBot: props.match.params.id,
	supportPlatforms: state.getIn(['bot', 'supportPlatforms'])
});

export default compose(
	translate('translations'),
	connect(mapStateToProps),
	toJS
)(WebSettingModal);
