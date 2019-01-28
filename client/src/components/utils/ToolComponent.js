import React from "react"
import Dropzone from "react-dropzone"
import FileDownload from "react-file-download"
import groupApis from "apis/group"
import _ from 'lodash'
import { compose } from "recompose"
import { connect } from "react-redux"
import { translate } from "react-i18next"
import { fetchGroups, uploadGroups, trainGroups } from "actions/group"
import { updateBot } from '../../actions/bot'
import { Message, Button, Icon, Input, Form } from "semantic-ui-react"
import toJS from './ToJS'

class ToolComponent extends React.Component {

	state = {
		loading: false
	}

	_fetchGroups = (page=1, keyword='') => {
		const { fetchGroups, activeBot } = this.props;

		this.setState({ loading: true });

		fetchGroups(activeBot, page, keyword)
			.then(() => this.setState({ loading: false }))
			.catch(() => this.setState({ loading: false }))
	}

	onExport = (e) => {
		const { t, activeBot } = this.props;

		groupApis.export(activeBot)
			.then(data => FileDownload(data, "export.csv"))
			.catch(() => this.setState({ errors: t("errors.faq.export") }));
	}

	onDrop = (acceptedFiles, rejectedFiles) => {
		const { t, activeBot, uploadGroups } = this.props;
		const { activePage, keyword } = this.state

		if (acceptedFiles.length) {
			const files = new FormData();
			files.append("file", acceptedFiles[0]);

			this.setState({ loading: { upload: true } });

			uploadGroups(activeBot, files)
				.then(() => {
					this._fetchGroups(activePage, keyword);
					this.setState({ success: t("success.faq.upload"), errors: null });
				})
				.catch( res =>
					this.setState({ loading: {} , success: null, errors: t("errors.faq.upload") })
				);
		}
	}

	onTrain = () => {
		const { t, activeBot, trainGroups } = this.props;

		this.setState({ loading: { train: true } });

		trainGroups(activeBot)
			.then(() => this.setState({ loading: {}, success: t("success.faq.train") }))
			.catch(() => this.setState({ loading: {}, errors: t("errors.faq.train") }));
	}

	handleKeyDown = (e) => {
		if (e.keyCode == 13) {
			this.handleSubmitKeyword(e)
		}
	}

	handleSubmitKeyword = (e) => {
		this.props.onKeywordSubmit()
	}

	handleChangeKeyword = ({target: {value}}) => {
		this.props.onKeywordChange(value)
	}

	handlePostbackToggleClick = e => {
		e.preventDefault()
		const { info, updateBot } = this.props
		updateBot(info.id, Object.assign({}, info, {
			postback_activate: !info.postback_activate
		}))
	}

	render = () => {

		const { loading, errors, success } = this.state
		const { t, onCreateGroup, keyword, info, bots, user } = this.props

		const currentPaidtype = _.find(user.packages, p => p.name === user.paid_type)
		const faqCount = _.reduce(bots, (acc, bot) => (acc += (bot && bot.group && bot.group.length) || 0), 0)
		const faqLimit = currentPaidtype ? currentPaidtype.faq_amount : 0

		return (
			<div style={{ margin: "10px" }}>
				{errors && <Message error={!!errors} header={errors} />}
				{success && <Message success={!!success} header={success} />}
				<Button disabled={faqCount >= faqLimit} onClick={onCreateGroup} color='green'>
					<Icon name="pencil" />
					<span>{t("chatbot.faq.add")}&nbsp;
					{'(' + faqCount + ' / ' + faqLimit + ')'}</span>
				</Button>
				<Button onClick={this.onExport} color='orange'>
					<Icon name="download"/>
					{t("chatbot.faq.export")}
				</Button>
				<Dropzone
					onDrop={this.onDrop}
					style={{ display: "none" }}
					ref={(node) => { this.dropzoneRef = node; }}
				>
				</Dropzone>
				<Button
					loading={loading.upload}
					color='purple'
					onClick={ () => { this.dropzoneRef.open() }}
				>
					<Icon name="upload"/>
					{t("chatbot.faq.import")}
				</Button>
				<Button
					color='brown'
					loading={loading.train}
					onClick={this.onTrain}
				>
					<Icon name="flask"/>
					{t("chatbot.faq.train")}
				</Button>
				{/* <Input onKeyDown={this.handleKeyDown} placeholder={t('chatbot.faq.search')} onChange={this.handleChangeKeyword} value={keyword ? keyword : ''}icon={<Icon name='search' circular link onClick={this.handleSubmitKeyword} />} /> */}
				<Button icon={info.postback_activate ? 'check' : 'remove'} content={info.postback_activate ? t('chatbot.faq.disable_postback') : t('chatbot.faq.enable_postback')} floated='right' color={info.postback_activate ? 'green': 'grey'} onClick={this.handlePostbackToggleClick} />
			</div>
		)
	}
}

const mapStateToProps = (state, props) => ({
	info: state.getIn(['bot', 'bots', props.activeBot]) || {},
	bots: state.getIn(['bot', 'bots']),
	user: state.get('user')
})

export default compose(
	translate('translations'),
	connect(mapStateToProps, { fetchGroups, uploadGroups, trainGroups, updateBot }),
	toJS
)(ToolComponent)
