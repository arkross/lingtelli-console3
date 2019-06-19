import React from 'react'
import { connect } from 'react-redux'
import { fetchBots, updateBot, deleteBot } from 'actions/bot'
import { showInfo } from 'actions/message'
import BotConfigForm from 'components/forms/BotConfigForm'
import {translate} from 'react-i18next'

class BotConfigPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: false,
      showSuccess: false
    }
  }

  // on update
  onUpdate = (activeBot, data) => {
    this.props.updateBot(activeBot, data)
      .then( () => {
        this.setState({loading: true})
        this.props.fetchBots()
          .catch( err => {
            this.setState({ errors: err.response.data.errors })
          })
          .then(() => {
            this.setState({showSuccess: true})
          })
          .finally(() => {
            this.setState({loading: false})
          })
      })
      .catch( err => {
        console.log('Update error')
      })
  }

  onDelete = activeBot => {
    this.setState({ loading: true })
    const { deleteBot, history, showInfo, t} = this.props
    deleteBot(activeBot)
      .then( () => {
        this.props.fetchBots()
        showInfo(t('chatbot.delete.success'))
        history.push('/dashboard')
      }, err => {
        this.setState({ loading: false })
        console.log('Delete ERROR')
      })
  }

  render = () => {
    return (
      <BotConfigForm
        onUpdate={this.onUpdate}
        onDelete={this.onDelete}
        loading={this.state.loading}
        showSuccess={this.state.showSuccess}
      />
    )
  }
}

export default connect(null, { fetchBots, updateBot, deleteBot, showInfo })(translate()(BotConfigPage))
