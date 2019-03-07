import React from 'react';
import _ from 'lodash'
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { translate } from 'react-i18next';
import {
	Header,
	Table,
	Container,
	Dimmer,
	Loader
} from 'semantic-ui-react';
import toJS from 'components/utils/ToJS'
import qs from 'query-string'
import LingPagination from '../utils/LingPagination'
import { fetchHistory } from 'actions/bot'

class HistoryPage extends React.Component {
	constructor(props) {
		super(props)
		const params = props.location ? qs.parse(props.location.search) : {page: 1}
		this.state = {
			activePage: params.page || 1
		}
	}

	componentDidMount() {
		this.props.fetchData(1)
	}

	onPageChanged = (e, { activePage }) => {
		this.setState({ activePage })
		this.props.fetchData(activePage)
	}

	createHistoryElements = () => {
		const { histories } = this.props;
		return histories.results ?
		_.chain(histories.results)
			.groupBy('qa_pair')
			.map(pair => {
				const userContent = _.chain(pair)
					.filter(rec => rec.sender === 'USER')
					.map(rec => rec.content)
					.value()
				const botContent = _.chain(pair)
					.filter(rec => rec.sender === 'BOT')
					.map(rec => rec.content)
					.value()
				return {
					user: userContent.join(' | '),
					bot: botContent.join(' | '),
					created_at: pair[0].created_at
				}
			})
			.map((history, index) => 
				<Table.Row active={history.sender==='USER'} key={index}>
					<Table.Cell>
						{history.user}
					</Table.Cell>
					<Table.Cell>
						{history.bot}
					</Table.Cell>
					<Table.Cell>
						{history.created_at}
					</Table.Cell>
				</Table.Row>
			)
			.value()
		: []
	}


	render = () => {
		const { activePage } = this.state;
		const { histories, t, loading, location } = this.props;

		const centerStyle = {
			width: '35%',
			margin: 'auto'
		}

		const perPage = 50
		const totalPage = Math.ceil(histories.count / perPage)
		return (
			<Container fluid textAlign='center' className='history-container'>
				<Loader active={loading} />
				<Dimmer inverted active={loading} />
				{(!histories.results || !histories.count) && <Header as='h4'>{t('chatbot.history.empty')}</Header>} 
				{(!!histories.results && !!histories.count) &&
						<div>
							<Table celled>
								<Table.Header>
									<Table.Row>
										<Table.HeaderCell style={{width: '40%'}}>{t('chatbot.history.user')}</Table.HeaderCell>
										<Table.HeaderCell style={{width: '40%'}}>{t('chatbot.history.bot')}</Table.HeaderCell>
										<Table.HeaderCell style={{width: '20%'}}>{t('chatbot.history.datetime')}</Table.HeaderCell>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{this.createHistoryElements()}
								</Table.Body>
							</Table>
							{
								totalPage > 0 &&
									<div className='pagination-container' style={centerStyle}>
										<LingPagination
											history={this.props.history}
											location={location}
											activePage={activePage}
											onPageChange={this.onPageChanged}
											totalPages={totalPage}
										/>
									</div>
							}
						</div>
				}
			</Container>
		);
	};
}

const mapStateToProps = (state, ownProps) => ({
	activeBot: ownProps.match.params.id,
	histories: state.getIn(['bot', 'bots', ownProps.match.params.id, 'history']) || {}
});

export default compose(
	translate('translations'),
	connect(mapStateToProps),
	toJS
)(HistoryPage);
