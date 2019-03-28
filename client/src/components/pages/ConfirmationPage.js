import React from 'react';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { translate, Trans } from 'react-i18next';
import { resend } from 'actions/auth';
import { Message, Icon, Button } from 'semantic-ui-react';

class ConfirmationPage extends React.Component {
  state = {
    errors: {},
    loading: false,
    success: false,
    waiting: false,
  }

  componentWillUnMount = () => {
    clearInterval(this.timer);
  }

  onSend = (e) => {
    const { username } = this.props.location.state;

    this.setState({ loading: true });

    this.props.resend(username)
      .then(() => this.setState({ success: true, loading: false }))
      .catch((res) => {
        // call tick() every 1 minute
        this.timer = setInterval(this.tick, 1000);
        this.setState({
          success: false,
          waiting: true,
          loading: false,
          elapsed: res.response.data.time,
        })
      })
  }

  tick = () => {
    const elapsed = this.state.elapsed - 1;

    if (elapsed === 0) {
      this.setState({ waiting: false });
      clearInterval(this.timer); }
    else {
      this.setState({ elapsed: elapsed });
    }
  }

  render = () => {
    // if (!this.props.location.state)
    //   this.props.history.push('/login');

    const { t } = this.props;
    const { loading, success, waiting, elapsed } = this.state;

    const minutes = Math.ceil(elapsed/60);

    return (
      <Message icon style={{ display: 'block' }}>
        <Message.Header>
          {t('account.confirmation.description')}
        </Message.Header>

        {waiting &&
          <Message.Content>
            <Trans i18nKey='account.confirmation.status.wait'>
              Please wait <span style={{color: 'red'}}>{{minutes}}</span> minutes for resend.
            </Trans>
          </Message.Content>
        }

        {!waiting &&
          <Message.Content>
            {loading && <Icon name='circle notched' loading />}
            {success && <Icon name='checkmark' />}
            <Button onClick={this.onSend}>
              {t('account.confirmation.status.resend')}
            </Button>
          </Message.Content>
        }

      </Message>
    )
  }
}

export default compose(
  translate('translations'),
  connect(null, { resend })
)(ConfirmationPage);
