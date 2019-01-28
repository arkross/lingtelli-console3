import React from 'react';
import PropTypes from 'prop-types'
import { Button, Modal, Icon } from 'semantic-ui-react';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { translate } from 'react-i18next';
import { createBot } from 'actions/bot';
import CreateBotForm from 'components/forms/CreateBotForm';

class CreateBotModal extends React.Component {
  state = {
    errors: {},
    loading: false,
    data: {
      packageSelect: -1
    }
  }

  // CreateBotForm: input fields listener
  onChange = (e, {name, value}) => {
    this.setState({
      data: { ...this.state.data, [name]: value }
    });
  }

  onPackageSelect = (e, { value }) => {
    this.setState({
        data: { ...this.state.data, packageSelect: value }
    });
  }

  validate = (data) => {
    const errors = {};
    const { t } = this.props;

    if (!data.robotName || data.robotName.trim().length===0)
      errors.robotName = t('errors.robotName.blank');
    if (!data.greetingMsg|| data.greetingMsg.trim().length===0)
      errors.greetingMsg = t('errors.greetingMsg.blank');
    if (!data.failedMsg || data.failedMsg.trim().length===0)
      errors.failedMsg = t('errors.failedMsg.blank');
    if ( ! data.language || data.language.trim().length === 0) {
      errors.language = t('errors.language.blank')
    }
    if (data.packageSelect===-1)
      errors.package = t('errors.package.invalid');

    return errors
  };

  onCreate = () => {
    const errors = this.validate(this.state.data);
    this.setState({ errors });
    if (Object.keys(errors).length === 0) {
      this.setState({ loading: true });
      this.props.createBot(this.state.data)
        .then(() => {
          this.setState({ loading: false });
          this.props.onCloseBot();
        })
        .catch(err => err.response.data.errors)
        .then(err => {
          this.setState({ errors: { create: err }, loading: false});
          console.log('Failed to create bot', err);
        });
    }
  }

  onClose = () => {
    // clear the errors state
    this.setState({ errors: {} });
    this.props.onCloseBot();
  }

  render = () => {
    const { open, t } = this.props;
    const { errors, loading, data } = this.state;
    const { packageSelect } = data;

    return (
      <Modal open={open} onClose={this.onClose} closeOnDimmerClick={!loading}>
        <Modal.Header>{t('chatbot.create.text')}</Modal.Header>
        <Modal.Content scrolling>
          <CreateBotForm
            className='create-bot-container'
            packageSelect={packageSelect}
            onChange={this.onChange}
            onPackageSelect={this.onPackageSelect}
            errors={errors}
            data={data}
          />
        </Modal.Content>
        <Modal.Actions>
          <Button
            loading={loading}
            primary
            onClick={this.onCreate}
          >
            <Icon name='checkmark' />
            {t('chatbot.create.btns.create')}
          </Button>
          <Button loading={loading} onClick={this.onClose}>
            <Icon name='remove' />
            {t('chatbot.create.btns.cancel')}
          </Button>
        </Modal.Actions>
      </Modal>
    )
  }
}

CreateBotModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onCloseBot: PropTypes.func.isRequired
}

export default compose(
  translate('translations'),
  connect(null, { createBot })
)(CreateBotModal);
