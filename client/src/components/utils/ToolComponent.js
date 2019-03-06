import React, { Fragment } from "react"
import Dropzone from "react-dropzone"
import FileDownload from "react-file-download"
import groupApis from "apis/group"
import _ from 'lodash'
import { compose } from "recompose"
import { connect } from "react-redux"
import { translate, Trans } from "react-i18next"
import { fetchGroups, uploadGroups, trainGroups } from "actions/group"
import { updateBot, fetchBot } from '../../actions/bot'
import { hideAllMessages, showSuccess } from '../../actions/message'
import { Message, Button, Icon, Input, Form, Radio, List, Dropdown, Modal } from "semantic-ui-react"
import toJS from './ToJS'

class ToolComponent extends React.Component {

	state = {
		loading: false,
		openSettingModal: false
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
			.catch(() => this.setState({ errors: t("errors.faq.export") }))
	}

	onDrop = (acceptedFiles, rejectedFiles) => {
		const { t, activeBot, uploadGroups } = this.props;
		const { activePage, keyword } = this.state

		if (acceptedFiles.length) {
			const files = new FormData();
			files.append("file", acceptedFiles[0]);

			this.setState({ loading: { upload: true } });

			uploadGroups(activeBot, files)
				.then(data => {
					this.props.showSuccess(data.success)	
					this._fetchGroups(activePage, keyword);
					this.setState({ success: t("success.faq.upload"), errors: null });
				})
				.catch( res =>
					this.setState({ loading: {} , success: null, errors: t("errors.faq.upload") })
				)
		}
	}

	onTrain = () => {
		const { t, activeBot, trainGroups } = this.props;

		this.setState({ loading: { train: true } });

		trainGroups(activeBot)
			.then(data => {
				this.props.showSuccess(data.success)
				this.setState({ loading: {}, success: t("success.faq.train"), errors: null })
			})
			.catch(() => this.setState({ loading: {}, errors: t("errors.faq.train"), success: null }))
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
		const { info, updateBot, fetchBot } = this.props
		return updateBot(info.id, Object.assign({}, info, {
			postback_activate: !info.postback_activate
		}))
		.then(() => fetchBot(info.id))
	}

	handleChooseAnswerChange = (e, { value }) => {
		e.preventDefault()
		const { info, updateBot, fetchBot } = this.props
		return updateBot(info.id, Object.assign({}, info, {
			choose_answer: value
		}))
		.then(() => fetchBot(info.id))
	}

	handleOpenSettings = e => {
		this.setState({openSettingModal: true})
	}

	handleCloseSettings = e => {
		this.setState({openSettingModal: false})
	}

	render = () => {

		const { loading, errors, success, openSettingModal } = this.state
		const { t, onCreateGroup, keyword, info, bots, user } = this.props

		const currentPaidtype = _.find(user.packages, p => p.name === user.paid_type)
		const faqCount = _.reduce(bots, (acc, bot) => (acc += (bot && bot.group && bot.group.count) || 0), 0)
		const faqLimit = currentPaidtype ? currentPaidtype.faq_amount : 0
		const faqLimitText = faqLimit > 0 ? faqLimit : '∞'
		const answer_choice = [
			{value: '1', text: t(`chatbot.faq.answer_choice.1`), key: 1},
			{value: '2', text: t(`chatbot.faq.answer_choice.2`), key: 2}
		]

		return (<Fragment>
			<div>
				{errors && <Message error={!!errors} header={errors} />}
				{success && <Message success={!!success} header={success} />}
				<Button disabled={faqCount >= faqLimit && faqLimit > 0} onClick={onCreateGroup} color='green'>
					<Icon name="pencil" />
					<span>{t("chatbot.faq.add")}&nbsp;
					{'(' + faqCount + ' / ' + faqLimitText + ')'}</span>
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
				<Modal
					trigger={<Button onClick={this.handleOpenSettings} icon='ellipsis horizontal' />}
					open={openSettingModal}
					onClose={this.handleCloseSettings}
					size='tiny'
				>
					<Modal.Header>{t('chatbot.faq.settings')}</Modal.Header>
					<Modal.Content>

						<List divided verticalAlign='middle'>
							<List.Item>
								<List.Content floated='left'>
									{t('chatbot.faq.enable_postback')}
								</List.Content>
								<List.Content floated='right'>
									<Radio toggle onChange={this.handlePostbackToggleClick} checked={info.postback_activate} />
								</List.Content>
							</List.Item>
							<List.Item>
								<List.Content floated='left'>
									{t('chatbot.faq.answer_choice.label')}
								</List.Content>
								<List.Content floated='right'>
									<Dropdown selection options={answer_choice} value={info.choose_answer} onChange={this.handleChooseAnswerChange} />
								</List.Content>
							</List.Item>
						</List>
					</Modal.Content>
				</Modal>
				{/* <Input onKeyDown={this.handleKeyDown} placeholder={t('chatbot.faq.search')} onChange={this.handleChangeKeyword} value={keyword ? keyword : ''}icon={<Icon name='search' circular link onClick={this.handleSubmitKeyword} />} /> */}
			</div>
		</Fragment>)
	}
}

const mapStateToProps = (state, props) => ({
	info: state.getIn(['bot', 'bots', props.activeBot]) || {},
	bots: state.getIn(['bot', 'bots']),
	user: state.get('user')
})

export default compose(
	translate('translations'),
	connect(mapStateToProps, { fetchGroups, uploadGroups, trainGroups, updateBot, fetchBot, hideAllMessages, showSuccess }),
	toJS
)(ToolComponent)
