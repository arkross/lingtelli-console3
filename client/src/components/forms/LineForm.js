import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { translate } from 'react-i18next';
import { Form, Segment, Icon } from 'semantic-ui-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import toJS from 'components/utils/ToJS'

const webhook_base_url = process.env.REACT_APP_WEBHOOK_HOST

class LineForm extends React.Component {

  state = {
    copied: false,
    line: this.props.line
  }

  componentWillMount = () => {
    this.setState({ copied: false, line: this.props.line });
  }

  onCopy = () => {
    this.setState({ copied: true });
  }

  render = () => {
    const { active, line, venderId, onChange, t } = this.props;
    const webhookURL = `${webhook_base_url}/line/${venderId}`;

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
            id='webhook_url_field'
            name='webhookURL'
            label={t('chatbot.setting.line.webhookURL')}
            value={webhookURL}
          ></Form.Input>
          <Form.Input
            type='text'
            name='secret'
            id='secret_field'
            label={t('chatbot.setting.line.secret')}
            disabled={!active}
            defaultValue={!!line ? line.secret : ''}
            onChange={onChange}
          ></Form.Input>
          <Form.Input
            type='text'
            name='token'
            id='token_field'
            label={t('chatbot.setting.line.token')}
            disabled={!active}
            defaultValue={!!line ? line.token : ''}
            onChange={onChange}
          ></Form.Input>
        </Form>
      </Segment>
    )
  };
};

LineForm.propTypes = {
  //onChange: PropTypes.func.isRequired,
  active: PropTypes.bool.isRequired
}

const mapStateToProps = (state, props) => ({
  venderId: state.getIn(['bot', 'bots', props.match.params.id, 'vendor_id'])
});

export default compose(
  translate('translations'),
  connect(mapStateToProps),
  toJS
)(LineForm);
