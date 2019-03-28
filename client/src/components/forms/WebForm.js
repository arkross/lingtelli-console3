import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux'
import { Segment, Button, Icon, Message } from 'semantic-ui-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { translate } from 'react-i18next'
import toJS from 'components/utils/ToJS'

class WebForm extends React.Component {
  state = {
    copied: false
  };

  componentWillMount() {
    this.setState({ copied: false });
  }

  onCopy = (e) => {
    this.setState({ copied: true });
  };

  render = () => {
    const { venderId, active, t, isActivated } = this.props;
    const { copied } = this.state;

    const content = (
    `<script type="text/javascript">window.LING_BOT = window.LING_BOT || {}; window.LING_BOT.KEY = '${venderId}'</script>
<script type="text/javascript" src="https://lingtelli-chatbot.oss-ap-southeast-1.aliyuncs.com/thrid-party.js"></script>`
    );

    return (
      <Segment disabled={!active}>
        {active && <pre>{content}</pre>}
        <CopyToClipboard text={content}>
          <Button
            disabled={!active}
            onClick={this.onCopy}
          >
			  <Icon name='copy' />
            {!copied ? t('chatbot.copy') : t('chatbot.copied')} 
          </Button>
        </CopyToClipboard>
        {!isActivated && <Message compact warning size='small'><Icon name='exclamation triangle' /> {t('errors.global.integration_not_activated')}</Message> }
      </Segment>
    )
  };
};

WebForm.propTypes = {
  active: PropTypes.bool.isRequired
}

const mapStateToProps = (state, props) => ({
  venderId: state.getIn(['bot', 'bots', props.match.params.id, 'vendor_id'])
});

export default connect(mapStateToProps)(translate()(toJS(WebForm)));
