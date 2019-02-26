import React, {Component} from 'react'
import { connect } from 'react-redux'
import { compose } from 'recompose'
import { translate } from 'react-i18next'
import toJS from 'components/utils/ToJS'
import { fetchMatching } from 'actions/bot'
import { Header, Table, Container, Dimmer, Loader, Pagination, Icon } from 'semantic-ui-react'
import _ from 'lodash'

class RecomLogPage extends Component {
	state = {
		activePage: 1,
		loading: true
	}

	handleAfterFetch = () => {
		this.setState({ loading: false})
	}

	componentWillUnmount() {
		this.handleAfterFetch = () => {}
	}

	componentDidMount() {
		this.fetchMatching()
	}

	fetchMatching = (activePage=null) => {
		this.props.fetchMatching(this.props.activeBot, activePage || this.state.activePage)
			.then(data => {
				this.handleAfterFetch()
			}, err => {
				this.handleAfterFetch()
			})
	}

	onPageChanged = (e, {activePage}) => {
		this.setState({ activePage })
		this.fetchMatching(activePage)
	}
	
	render() {
		const { t, data } = this.props
		const { loading, activePage } = this.state

		const perPage = 10
		const totalPages = Math.ceil(data.count / perPage)
		
		return <Container fluid textAlign='center'>
			<Dimmer inverted active={loading} />
			<Loader active={loading} />

			{ (data && data.count) ? 
			<div>
				<Table celled>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell>
								{t('chatbot.recommendations.ori_question')}
							</Table.HeaderCell>
							<Table.HeaderCell>
								{t('chatbot.recommendations.selected_question')}
							</Table.HeaderCell>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{_.map(data.results, el => <Table.Row key={el.id}>
							<Table.Cell>{el.ori_question}</Table.Cell>
							<Table.Cell>{el.select_question}</Table.Cell>
						</Table.Row>)}
					</Table.Body>
				</Table>
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
			</div> : <Header as='h4'>{t('chatbot.history.empty')}</Header>}
		</Container>
	}
}

const mapStateToProps = (state, props) => ({
	data: state.getIn(['bot', 'bots', props.match.params.id, 'recomlog']) || {},
	activeBot: props.match.params.id
})

export default compose(
	translate(),
	connect(mapStateToProps, { fetchMatching }),
	toJS
)(RecomLogPage)
