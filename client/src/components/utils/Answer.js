import React from "react";

import { compose } from "recompose";
import { connect } from 'react-redux';
import { translate } from "react-i18next";
import { Input } from "semantic-ui-react";
import { updateAnswer } from "actions/answer";
import toJS from './ToJS'

class Answer extends React.Component {
  state = {
    id: this.props.id,
    content: this.props.content || '',
    editable: false,
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

  onClick = (id, e) => {
    this.setState({editable: true});
  }

  onKeyPress = (e) => {
    if (e.keyCode === 13 || e.key === "Enter")
      this.update();
  }

  onBlur = (e) => {
    this.update();
  }

  onChange = (e) => {
    this.setState({ content: e.target.value });
  }

  componentDidUpdate = () => {
    if (this.state.editable) this.input.focus();
  }

  render = () => {
    const { content, editable } = this.state;
    const { t} = this.props;

    return (
      <div
        onClick={ e => this.onClick(10, e)}
        className="answer"
      >
        <Input
          placeholder={t("chatbot.faq.form.answer")}
          ref={ input => this.input = input }
          value={content}
          disabled={!editable}
          onBlur={this.onBlur}
          onKeyDown={this.onKeyPress}
          onChange={this.onChange}
        />
      </div>
    )
  }
}

export default compose(
  translate("translations"),
  connect(null, { updateAnswer }),
  toJS
)(Answer);
