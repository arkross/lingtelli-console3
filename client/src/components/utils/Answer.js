import React from "react";

import { compose } from "recompose";
import { connect } from 'react-redux';
import { translate } from "react-i18next";
import { Input, Button, Icon, Form } from "semantic-ui-react";
import { updateAnswer } from "actions/answer";
import toJS from './ToJS'

class Answer extends React.Component {
  state = {
    id: this.props.id,
    content: this.props.content || '',
    showCheck: false,
    editable: false,
    updateLoading: false,
    loading: false
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.content !== this.props.content) {
      this.setState({content: nextProps.content})
    }
  }

  componentWillUnmount() {
    this.cleanLoading = () => {}
  }

  cleanLoading = () => {
    this.setState({ loading: false })
  }

  update = () => {
    const { id, content } = this.state;
    const { updateAnswer, activeBot } = this.props;
    this.setState({ updateLoading: true })

    updateAnswer(activeBot, { id, content })
      .then(() => {
        this.setState({ editable: false, showCheck: true, updateLoading: false })
        setTimeout(() => {
          this.setState({ showCheck: false })
        }, 2000)
      })
      .catch(() => {
        this.setState({ editable: false, updateLoading: false });
      });
  }

  onDelete = (e, ix) => {
    e.preventDefault()
		this.setState({loading: true})
    this.props.onDelete(e, ix)
      .catch(err => this.setState({loading: false}))
      .finally(() => this.cleanLoading())
    return false
	}

  onClick = (id, e) => {
    this.setState({editable: true})
  }

  onKeyPress = (e) => {
    if (e.keyCode === 13 || e.key === "Enter")
      this.update();
  }

  onSubmit = e => {
    e.preventDefault()
    this.update()
    return false
  }

  onBlur = (e) => {
    this.onSubmit(e)
  }

  onChange = (e) => {
    this.setState({ content: e.target.value });
  }

  componentDidUpdate = () => {
    if (this.state.editable) this.input.focus();
  }

  render = () => {
    const { content, editable, loading, updateLoading, showCheck } = this.state;
    const { t, ix } = this.props;

    return (
      <Form
        ref={el => (this.formEl = el)}
        onSubmit={this.onSubmit}
        onClick={ e => this.onClick(10, e)}
        className="answer"
      >
        <Form.Input
          action
          placeholder={t("chatbot.faq.form.answer")}
          value={content}
          onBlur={this.onBlur}
          onChange={this.onChange}
          fluid
        >
          <input ref={ input => this.input = input } />
          <Button icon={showCheck ? 'check' : 'save'} loading={updateLoading} color='green' />
          <Button icon='trash alternate outline' loading={loading} color='red' className='question-delete' onClick={ e => this.onDelete(e, ix) } />
        </Form.Input>
      </Form>
    )
  }
}

export default compose(
  translate("translations"),
  connect(null, { updateAnswer }),
  toJS
)(Answer);
