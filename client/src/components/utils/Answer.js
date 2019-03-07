import React from "react";

import { compose } from "recompose";
import { connect } from 'react-redux';
import { translate } from "react-i18next";
import { Input, Button } from "semantic-ui-react";
import { updateAnswer } from "actions/answer";
import toJS from './ToJS'

class Answer extends React.Component {
  state = {
    id: this.props.id,
    content: this.props.content || '',
    editable: false,
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

    updateAnswer(activeBot, { id, content })
      .then(() => this.setState({ editable: false }))
      .catch(() => {
        console.log("failed to update answer");
        this.setState({ editable: false });
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
    const { content, editable, loading } = this.state;
    const { t, ix } = this.props;

    return (
      <form
        ref={el => (this.formEl = el)}
        onSubmit={this.onSubmit}
        onClick={ e => this.onClick(10, e)}
        className="answer"
      >
        <Input
          action
          placeholder={t("chatbot.faq.form.answer")}
          ref={ input => this.input = input }
          value={content}
          onBlur={this.onBlur}
          onChange={this.onChange}
        >
          <input disabled={!editable} />
          <button type='submit' style={{display: 'none'}} />
					<Button icon='trash alternate outline' loading={loading} color='red' className='question-delete' onClick={ e => this.onDelete(e, ix) } />
        </Input>
      </form>
    )
  }
}

export default compose(
  translate("translations"),
  connect(null, { updateAnswer }),
  toJS
)(Answer);
