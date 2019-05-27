import React, {Fragment} from 'react'
import { translate } from 'react-i18next'
import { compose } from 'recompose'
import { Pagination, Icon, Button, Input, Responsive } from 'semantic-ui-react'
import qs from 'query-string'

class LingPagination extends React.Component {
	constructor(props) {
		super(props)
		const params = props.location ? qs.parse(props.location.search) : {page: 1}
		this.state = {
			pageInput: props.activePage || params.page || 1
		}
	}

	componentDidUpdate(prevProps) {
		if (prevProps.location) {
			if (prevProps.location.search !== this.props.location.search) {
				const params = qs.parse(this.props.location.search) || { page: 1 }
				this.setState({ pageInput: params.page })
			}
		}
		if (prevProps.activePage !== this.props.activePage) {
			this.setState({ pageInput: this.props.activePage })
			this.changeUrlQuery(this.props.activePage)
		}
	}

	onInputPageChanged = (e, { value }) => {
		if (value > this.props.totalPages) {
			this.setState({ pageInput: this.props.totalPages })
		} else if (value < 1) {
			this.setState({ pageInput: 1})
		} else {
			this.setState({ pageInput: value })
		}
	}

	onInputPageSubmitClick = e => {
		e.preventDefault()
		if (parseInt(this.props.activePage) !== parseInt(this.state.pageInput)) {
			this.onPageChange(e, {activePage: this.state.pageInput})
		}
		return false
	}

	changeUrlQuery = page => {
		const params = this.props.location ? qs.parse(this.props.location.search) : {page}
		params.page = page
		this.props.history.push({
			search: `?${qs.stringify(params)}`
		})
	}

	onPageChange = (e, data) => {
		this.setState({ pageInput: data.activePage })
		if (this.props.history) {
			this.changeUrlQuery(data.activePage)
		}
		this.props.onPageChange(e, data)
	}

	render() {
		const {totalPages, t} = this.props
		const {pageInput, activePage} = this.state
		const params = this.props.location ? qs.parse(this.props.location.search) : {page: 1}
		return <form onSubmit={this.onInputPageSubmitClick}>
			<Responsive minWidth={Responsive.onlyComputer.minWidth} as={Pagination}
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
				<input style={{width: '6em'}} />
				<Button content={t('chatbot.faq.gotopage')} onClick={this.onInputPageSubmitClick} />
			</Input>
		</form>
	}
}

export default compose(
	translate()
)(LingPagination)