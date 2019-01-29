import React from 'react';
import BotMessageBox from 'components/utils/BotMessageBox';
import api from 'apis/demo';
import { compose } from 'recompose';
import { translate } from 'react-i18next';
import { connect } from 'react-redux';
import { Modal, Input } from 'semantic-ui-react';
import toJS from 'components/utils/ToJS'

class DemoModal extends React.Component {
  state = {
    loading: false,
    text: null,
    history: [{
      role: 'bot', text: this.props.greeting
    }]
  }

  onChange = (e) => {
    this.setState({ text: e.target.value });
  }

  onSubmit = (e) => {
    if (e.key === 'Enter') {
      this.setState({
        history: [...this.state.history, {role:'user', text: e.target.value}]
      });
      // call api
      this.request(e.target.value);
      e.target.value = null;
    }
  }

  request = (text) => {
    const { venderId, t } = this.props;
    api.ask(venderId, text)
      .then( res => res.data)
      .then( data => {
        this.setState({
          history: [...this.state.history, { role: 'bot', text: data.text }]
        });
      })
      .catch( () => {
        this.setState({
          history: [...this.state.history, { role: 'bot', text: t('errors.demo.ask') }]
        });
      })
  }

  componentDidUpdate() {
    // tricky to scrollToBottom, because Sytle calculated after componentDidUpdate
    window.setTimeout( () => {
      this.refs.chatBody.scrollTop = this.refs.chatBody.scrollHeight;
    }, 10);
  }

  render = () => {
    const { loading, history } = this.state;
    const { open, closeModal, venderId, t } = this.props;

    if (!venderId) {
      return (
        <Modal size='mini' open={open} onClose={closeModal} closeOnDimmerClick={!loading}>
          <Modal.Header>{t('demo.warning')}</Modal.Header>
        </Modal>
      )
    }

    return (
      <Modal
        size='tiny'
        open={open}
        onClose={closeModal}
        className='demo-bot-container'
        closeOnDimmerClick={!loading}
      >
        <div className='chat-container'>
          <div className='chat-header'>
            <label className='chat-title'>{t('demo.title')}</label>
          </div>
          <div className='chat-body' ref='chatBody'>
          {
            history.map( (item, index) =>
              <BotMessageBox key={index} role={item.role} text={item.text} />
            )
          }
          </div>
          <div className='chat-input-container absolute'>
            <Input
              onChange={this.onChange}
              onKeyPress={this.onSubmit}
              className='chat-input'
              placeholder={t('demo.input')}/>
          </div>
        </div>
      </Modal>
    );
  }
}

const mapStateToProps = (state, props) => ({
  venderId: state.getIn(['bot', 'bots', props.match.params.id, 'vender_id']),
  greeting: state.getIn(['bot', 'bots', props.match.params.id, 'greeting_msg'])
})

export default compose(
  translate('translations'),
  connect(mapStateToProps),
  toJS
)(DemoModal);
