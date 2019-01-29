import React from 'react';
import PropTypes from 'prop-types'
import LineForm from 'components/forms/LineForm';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { translate, Trans } from 'react-i18next';
import { updateBot } from 'actions/bot';
import {
  Button,
  Modal,
  Icon,
  Image,
  Label,
  List,
  Message
} from 'semantic-ui-react'
import toJS from 'components/utils/ToJS'

class LineSettingModal extends React.Component {
  state = {
    errors: {},
    loading: false,
    copied: false,
    data: {
      line: this.props.line,
      platform: this.props.platform
    }
  }

  onChange = (e) => {
    this.setState({
      ...this.state,
      data: {
        ...this.state.data,
        line: { ...this.state.data.line, [e.target.name]: e.target.value }
      }
    });
  }

  validate = (data) => {
    const errors = {};
    const { t } = this.props;

    if (!data.token)
      errors.token = t('errors.token');
    if (!data.secret)
      errors.secret = t('errors.secret');

    return errors
  };

  activate = () => {
    const { platform } = this.state.data;
    const { supportPlatforms } = this.props;

    const ix = supportPlatforms.map(item => item.name === 'Line').indexOf(true);

    return platform.indexOf(ix+1)>=0;
  }

  onSave = () => {
    const errors = this.validate(this.state.data.line);
    this.setState({ errors: errors });
    if (Object.keys(errors).length === 0) {
      this.setState({ loading: true });
      this.props.updateBot(this.props.activeBot, this.state.data)
        .then( () => {
          this.setState({ loading: false });
        }).catch( () => {
          console.log("ERROR");
      });
    }
  }

  onClose = () => {
    // clear the errors state
    this.setState({ errors: {} });
    this.props.onCloseModal();
  }

  render = () => {
    const { open, t, match } = this.props;
    const { loading, data } = this.state;
    const step3 = require(`../../assets/img/chatbot/en-us/line/03_provider.PNG`)
    const step4 = require(`../../assets/img/chatbot/en-us/line/04_channel.PNG`)
    const step6 = require(`../../assets/img/chatbot/en-us/line/06_access_token.PNG`)
    const step8 = require(`../../assets/img/chatbot/en-us/line/08_secret.PNG`)

    return (
      <Modal className='chatbot-modal' open={open} onClose={this.onClose} closeIcon closeOnDimmerClick={!loading}>
        <Modal.Header>{t('chatbot.setting.line.title')}</Modal.Header>
        <Modal.Content style={{marginTop: '10px', fontSize: '15px'}} scrolling>
          <p style={{ whiteSpace: 'pre-line' }} >
            {t('chatbot.setting.line.description')}
          </p>
          <List ordered relaxed>
            <List.Item>{t('chatbot.setting.line.steps._1')}</List.Item>
            <List.Item><Trans i18nKey='chatbot.setting.line.steps._2'><a href='https://developers.line.me' target="_BLANK">0</a><strong>1</strong></Trans></List.Item>
            <List.Item><Trans i18nKey='chatbot.setting.line.steps._3'><strong>0</strong></Trans><br /><Image src={step3} /></List.Item>
            <List.Item><Trans i18nKey='chatbot.setting.line.steps._4'><strong>0</strong></Trans><br /><Image src={step4} /></List.Item>
            <List.Item>{t('chatbot.setting.line.steps._5')}</List.Item>
            <List.Item><Trans i18nKey='chatbot.setting.line.steps._6'><strong>0</strong><strong>1</strong><strong>2</strong></Trans><br /><Image src={step6} /></List.Item>
            <List.Item><Trans i18nKey='chatbot.setting.line.steps._7'><strong>0</strong><Label as='label' htmlFor='token_field' content={t('chatbot.setting.line.token')}></Label></Trans></List.Item>
            <List.Item><Trans i18nKey='chatbot.setting.line.steps._8'><strong>0</strong><strong>1</strong><Label as='label' htmlFor='secret_field' content={t('chatbot.setting.line.secret')}></Label></Trans><br /><Image src={step8} /></List.Item>
            <List.Item><Trans i18nKey='chatbot.setting.line.steps._9'><Label as='label' htmlFor='webhook_url_field' content={t('chatbot.setting.line.webhookURL')}></Label><strong>1</strong><strong>2</strong></Trans></List.Item>
            <List.Item>{t('chatbot.setting.line.steps._10')}</List.Item>
          </List>
          <LineForm match={match} onChange={this.onChange} active={!loading} line={data.line}/>
        </Modal.Content>
        <Modal.Actions>
          {!this.activate() && <Message compact warning size='small'><Icon name='exclamation triangle' /> {t('errors.global.integration_not_activated')}</Message> }
          <Button
            loading={loading}
			primary
            disabled={!this.activate()}
            onClick={this.onSave}
          >
            <Icon name='check' />
			{t('chatbot.update')}
          </Button>
        </Modal.Actions>
      </Modal>
    )
  }
}

LineSettingModal.propTypes = {
  open: PropTypes.bool.isRequired,
  //onCloseBot: PropTypes.func.isRequired
}

const mapStateToProps = (state, props) => ({
  activeBot: props.match.params.id, 
  supportPlatforms: state.getIn(['bot', 'supportPlatforms'])
});

export default compose(
  translate('translations'),
  connect(mapStateToProps, { updateBot }),
  toJS
)(LineSettingModal);
