import React from 'react'
import Group from 'components/utils/Group'
import ToolComponent from 'components/utils/ToolComponent'
import groupApis from 'apis/group'
import answerApis from 'apis/answer'
import questionApis from 'apis/question'
import _ from 'lodash'
import { connect } from 'react-redux'
import { compose } from 'recompose'
import { translate } from 'react-i18next'
import { fetchGroups, fetchGroup, deleteGroup } from 'actions/group'
import { updateBot } from '../../actions/bot'
import {
	Icon,
	Segment,
	Pagination,
	Modal,
	Button
} from 'semantic-ui-react'
import toJS from 'components/utils/ToJS'

const PER_PAGE = 10

class FAQConfigPage extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			groups: [],
			loading: false,
			activePage: 1,
			keyword: props.answer_content,
			openDeleteModal: false,
			deleteGroupId: null
		}
	}

	componentWillReceiveProps(props) {
		this.setState({ groups: props.groups || [] });
	}

	_fetchGroups = (page=1, keyword='') => {
		return this.props.fetchData(page, keyword)
	}

	componentDidMount = () => {
		this._fetchGroups(1, this.props.answer_content);
	}

	onPageChanged = (e, { activePage }) => {
		this.setState({ activePage: activePage });
		// this._fetchGroups(activePage, this.state.keyword);
	}

	onCreateGroup = (e) => {
		groupApis.create(this.props.activeBot)
			.then(({ id }) =>
				answerApis.create(this.props.activeBot, id)
					.then(() => questionApis.create(this.props.activeBot, id))
					.then(() => this._fetchGroups())
					.catch(() => console.log('Failed to create answer.'))
			)
			.catch(() => console.log('Failed to create group.'))
	}

	onFetchGroup = groupId => {
		return this.props.fetchGroup(this.props.activeBot, groupId)
	}

	// DELETE GROUP
	onDeleteGroupClick = (ix, e) => {
		e.preventDefault()
		this.setState({ openDeleteModal: true, deleteGroupId: ix})
	}
	onDeleteModalClose = () => {
		this.setState({ openDeleteModal: false })
	}
	onDeleteGroup = () => {
		return this.props.deleteGroup(this.props.activeBot, this.state.deleteGroupId)
			.then(() => {
				this._fetchGroups(this.state.activePage)
				this.setState({ openDeleteModal: false })
			})
	}

	handleKeywordSubmit = () => {
		this.setState({
			activePage: 1
		})
		this._fetchGroups(1, this.state.keyword)
	}

	handleKeywordChange = (keyword) => {
		this.setState({
			keyword
		})
	}

	render = () => {
		const { length, loading, activeBot, t } = this.props
		const { groups, activePage, keyword, openDeleteModal } = this.state

		const totalPages = Math.ceil(length / PER_PAGE)
		const startNumber = PER_PAGE * (activePage - 1)
		const displayGroups = _.slice(groups, startNumber, startNumber + PER_PAGE + 1)
		return (
			<div>
				<ToolComponent onKeywordSubmit={this.handleKeywordSubmit} keyword={keyword} onKeywordChange={this.handleKeywordChange} activeBot={activeBot} onCreateGroup={this.onCreateGroup} />
				<Segment vertical loading={loading}>
					{
						totalPages > 0 &&
							<Pagination
								firstItem={{ content: <Icon name='angle double left' />, icon: true }}
								lastItem={{ content: <Icon name='angle double right' />, icon: true }}
								prevItem={{ content: <Icon name='angle left' />, icon: true }}
								nextItem={{ content: <Icon name='angle right' />, icon: true }}
								ellipsisItem={{ content: <Icon name='ellipsis horizontal' />, icon: true }}
								activePage={activePage}
								onPageChange={this.onPageChanged}
								totalPages={totalPages}
							/>
					}
					{ displayGroups &&
						displayGroups.map((item, ix) =>
							<Group
								ix={ix}
								key={item.group}
								id={item.group}
								questions={item.question}
								answers={item.answer}
								onDelete={this.onDeleteGroupClick.bind(this, item.group)}
								fetchGroup={this.onFetchGroup.bind(this, item.group)}
								activeBot={activeBot}
							/>
						)
					}
					{
						totalPages > 0 &&
							<Pagination
								firstItem={{ content: <Icon name='angle double left' />, icon: true }}
								lastItem={{ content: <Icon name='angle double right' />, icon: true }}
								prevItem={{ content: <Icon name='angle left' />, icon: true }}
								nextItem={{ content: <Icon name='angle right' />, icon: true }}
								ellipsisItem={{ content: <Icon name='ellipsis horizontal' />, icon: true }}
								activePage={activePage}
								onPageChange={this.onPageChanged}
								totalPages={totalPages}
							/>
					}
				</Segment>
				<Modal
					open={openDeleteModal}
					onClose={this.onDeleteModalClose}
				>
					<Modal.Header>{t('chatbot.faq.delete_modal.title')}</Modal.Header>
					<Modal.Content>
						<Modal.Description>{t('chatbot.faq.delete_modal.message')}</Modal.Description>
					</Modal.Content>
					<Modal.Actions>
						<Button onClick={this.onDeleteModalClose} disabled={loading}>
						{t('chatbot.delete.cancel')}</Button>
						<Button onClick={this.onDeleteGroup} negative disabled={loading} loading={loading}>{t('chatbot.faq.delete_modal.title')}</Button>
					</Modal.Actions>
				</Modal>
			</div>
		)
	}
}


const mapStateToProps = (state, ownProps) => ({
	activeBot: ownProps.match.params.id,
	groups: state.getIn(['bot', 'bots', ownProps.match.params.id, 'group', 'groups']),
	length: state.getIn(['bot', 'bots', ownProps.match.params.id, 'group', 'length']),
	answer_content: state.getIn(['bot', 'bots', ownProps.match.params.id, 'group', 'answer_content'])
})

export default compose(
	translate('translations'),
	connect(mapStateToProps, { updateBot, fetchGroups, fetchGroup, deleteGroup }),
	toJS
)(FAQConfigPage)
