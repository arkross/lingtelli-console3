import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { translate } from 'react-i18next';
import { Form, Segment, Icon } from 'semantic-ui-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import toJS from 'components/utils/ToJS'

const webhook_base_url = process.env.REACT_APP_WEBHOOK_HOST

class FacebookForm extends React.Component {
  state = {
    copied: false,
    facebook: this.props.facebook
  }

  onChange = (e) => {
    this.setState({
       facebook: { ...this.state.facebook, [e.target.name]: e.target.value }
    });
  }

  componentWillMount = () => {
    this.setState({ copied: false, facebook: this.props.facebook });
  }

  onCopy = () => {
    this.setState({ copied: true })
  }

  render = () => {
    const { onChange, active, venderId, facebook, t } = this.props;
    const webhookURL = `https://${webhook_base_url}/facebook/${venderId}`

    return (
      <Segment disabled={!active}>
        <Form>
            <Form.Input
              icon={
                <CopyToClipboard text={webhookURL} onCopy={this.onCopy}>
                  <Icon name='copy' link />
                </CopyToClipboard>
              }
              type='text'
              name='webhookURL'
              id='webhook_url_field'
              label={t('chatbot.setting.facebook.webhookURL')}
              value={webhookURL}
            ></Form.Input>
          <Form.Input
            type='text'
            name='token'
            id='access_token_field'
            label={t('chatbot.setting.facebook.token')}
            disabled={!active}
            defaultValue={!!facebook ? facebook.token : ''}
            onChange={onChange}
          ></Form.Input>
          <Form.Input
            type='text'
            name='verify_str'
            id='verify_token_field'
            label={t('chatbot.setting.facebook.verify')}
            disabled={!active}
            defaultValue={!!facebook ? facebook.verify_str: ''}
            onChange={onChange}
          ></Form.Input>
        </Form>
      </Segment>
    );
  }
}

FacebookForm.propTypes = {
  //onChange: PropTypes.func.isRequired,
  active: PropTypes.bool.isRequired
}

const mapStateToProps = (state, props) => ({
  venderId: state.getIn(['bot', 'bots', props.match.params.id, 'vender_id'])
});

export default compose(
  translate('translations'),
  connect(mapStateToProps),
  toJS
)(FacebookForm);
