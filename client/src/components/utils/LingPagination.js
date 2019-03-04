import React, {Fragment} from 'react'
import { translate } from 'react-i18next'
import { compose } from 'recompose'
import { Pagination, Icon, Button, Input } from 'semantic-ui-react'
import qs from 'query-string'

class LingPagination extends React.Component {
	constructor(props) {
		super(props)
		const params = props.location ? qs.parse(props.location.search) : {page: 1}
		this.state = {
			pageInput: props.activePage || params.page || 1
		}
	}

	onInputPageChanged = (e, { value }) => {
		this.setState({ pageInput: value })
	}

	onInputPageSubmitClick = e => {
		this.props.onPageChange(e, {activePage: this.state.pageInput})
	}

	onPageChange = (e, data) => {
		this.setState({ pageInput: data.activePage })
		this.props.onPageChange(e, data)
	}

	render() {
		const {totalPages, t} = this.props
		const {pageInput, activePage} = this.state
		const params = this.props.location ? qs.parse(this.props.location.search) : {page: 1}
		return <Fragment>
			<Pagination
				firstItem={{ content: <Icon name='angle double left' />, icon: true }}
				lastItem={{ content: <Icon name='angle double right' />, icon: true }}
				prevItem={{ content: <Icon name='angle left' />, icon: true }}
				nextItem={{ content: <Icon name='angle right' />, icon: true }}
				ellipsisItem={{ content: <Icon name='ellipsis horizontal' />, icon: true }}
				activePage={activePage || params.page || 1}
				onPageChange={this.onPageChange}
				totalPages={totalPages}
			/>
			{' '}
			<Input action type='number' step={1} min={1} max={totalPages} value={pageInput} onChange={this.onInputPageChanged}>
				<input size={3} />
				<Button content={t('chatbot.faq.gotopage')} onClick={this.onInputPageSubmitClick} />
			</Input>
		</Fragment>
	}
}

export default compose(
	translate()
)(LingPagination)