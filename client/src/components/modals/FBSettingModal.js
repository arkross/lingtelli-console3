import React from 'react';
import PropTypes from 'prop-types'
import FacebookForm from 'components/forms/FacebookForm';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { updateBot } from 'actions/bot';
import { translate, Trans } from 'react-i18next';
import {
  Button,
  Modal,
  Icon,
  List,
  Image,
  Label,
  Message
} from 'semantic-ui-react';
import toJS from '../utils/ToJS'

class FBSettingModal extends React.Component {

  state = {
    loading: false,
    errors: {},
    data: {
      facebook: this.props.facebook,
      platform: this.props.platform
    }
  }

  activate = () => {
    const { platform } = this.state.data;
    const { supportPlatforms } = this.props;

    const ix = supportPlatforms.map(item=>item.name==='Facebook').indexOf(true);

    return platform.indexOf(ix+1)>=0;
  }

  validate = (data) => {
    const errors = {};
    if (!data.token)
      errors.token = "Token can't be blank.";
    if (!data.verify_str)
      errors.token = "Verify string can't be blank.";

    return errors
  };

  onChange = (e) => {
    this.setState({
      data: {
        ...this.state.data,
        facebook: { ...this.state.data.facebook, [e.target.name]: e.target.value }
      }
    });
  }

  onSave = () => {
    const errors = this.validate(this.state.data.facebook);
    this.setState({ errors: errors });
    if (Object.keys(errors).length === 0) {
      this.setState({ loading: true });
      this.props.updateBot(this.props.activeBot, this.state.data)
        .then( () => {
          this.setState({ loading: false });
        }).catch( err => {
          console.log(err);
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
    const curlang = localStorage.i18nextLng.toLowerCase()
    const step4 = require(`../../assets/img/chatbot/${curlang}/facebook/04_my_apps.PNG`)
    const step5 = require(`../../assets/img/chatbot/${curlang}/facebook/05_messenger.PNG`)
    const step6 = require(`../../assets/img/chatbot/${curlang}/facebook/06_token_generation.PNG`)
    const step9 = require(`../../assets/img/chatbot/${curlang}/facebook/09_webhook.PNG`)
    const step12 = require(`../../assets/img/chatbot/${curlang}/facebook/12_subscription.PNG`)
    const step13 = require(`../../assets/img/chatbot/${curlang}/facebook/13_subscribe.PNG`)
    const step14 = require(`../../assets/img/chatbot/${curlang}/facebook/14_review.PNG`)

    return (
      <Modal className='chatbot-modal' open={open} onClose={this.onClose} closeIcon closeOnDimmerClick={!loading}>
        <Modal.Header>{t('chatbot.setting.facebook.title')}</Modal.Header>
        <Modal.Content style={{marginTop: '10px', fontSize: '15px'}} scrolling>
          <p style={{ whiteSpace: 'pre-line' }} >
            {t('chatbot.setting.facebook.description')}
          </p>
          <List ordered relaxed>
            <List.Item>{t('chatbot.setting.facebook.steps._1')}</List.Item>
            <List.Item>{t('chatbot.setting.facebook.steps._2')}</List.Item>
            <List.Item><Trans i18nKey='chatbot.setting.facebook.steps._3'><a href='https://developers.facebook.com' target='_BLANK'>0</a></Trans></List.Item>
            <List.Item><Trans i18nKey='chatbot.setting.facebook.steps._4'><strong>0</strong><strong>1</strong></Trans><br /> <Image src={step4} centered rounded bordered /></List.Item>
            <List.Item><Trans i18nKey='chatbot.setting.facebook.steps._5'><strong>0</strong><strong>1</strong></Trans><br/> <Image src={step5} centered rounded bordered /></List.Item>
            <List.Item><Trans i18nKey='chatbot.setting.facebook.steps._6'><strong>0</strong><strong>1</strong></Trans><br/> <Image src={step6} centered rounded bordered /></List.Item>
            <List.Item><Trans i18nKey='chatbot.setting.facebook.steps._7'><strong>0</strong><Label as='label' htmlFor='access_token_field' content={t('chatbot.setting.facebook.token')}></Label></Trans></List.Item>
            <List.Item><Trans i18nKey='chatbot.setting.facebook.steps._8'><Label as='label' htmlFor='verify_token_field' content={t('chatbot.setting.facebook.verify')}></Label></Trans></List.Item>
            <List.Item><Trans i18nKey='chatbot.setting.facebook.steps._9'><strong>0</strong><strong>1</strong></Trans><br/><Image src={step9} centered rounded bordered /></List.Item>
            <List.Item><Trans i18nKey='chatbot.setting.facebook.steps._10'><Label as='label' htmlFor='webhook_url_field' content={t('chatbot.setting.facebook.webhookURL')}></Label><strong>1</strong></Trans></List.Item>
            <List.Item><Trans i18nKey='chatbot.setting.facebook.steps._11'><Label as='label' htmlFor='verify_token_field' content={t('chatbot.setting.facebook.verify')}></Label><strong>1</strong><Label color='blue' content={t('chatbot.update')} icon='check'></Label></Trans></List.Item>
            <List.Item><Trans i18nKey='chatbot.setting.facebook.steps._12'><strong>0</strong><strong>1</strong><strong>2</strong></Trans><br/><Image src={step12} centerd rounded bordered /></List.Item>
            <List.Item><Trans i18nKey='chatbot.setting.facebook.steps._13'><strong>0</strong><strong>1</strong></Trans><br/><Image src={step13} centered rounded bordered /></List.Item>
            <List.Item><Trans i18nKey='chatbot.setting.facebook.steps._14'><strong>0</strong><strong>1</strong><strong>2</strong></Trans><br/><Image src={step14} centered rounded bordered /></List.Item>
            <List.Item>{t('chatbot.setting.facebook.steps._15')}</List.Item>
          </List>
          <FacebookForm match={match} onChange={this.onChange} active={!loading} facebook={data.facebook} />
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

FBSettingModal.propTypes = {
  open: PropTypes.bool.isRequired,
  //onCloseBot: PropTypes.func.isRequired
}

const mapStateToProps = (state, props) => ({
  activeBot: props.match.params.id,
  supportPlatforms: state.getIn(['bot', 'supportPlatforms'])
});

export default compose(
  translate('translations'),
  connect(mapStateToProps, { updateBot } ),
  toJS
)(FBSettingModal);
