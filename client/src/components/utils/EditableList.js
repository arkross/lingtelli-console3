import React, {Component, Fragment} from 'react'
import { Input, List, Button, Form } from 'semantic-ui-react'
import { translate } from 'react-i18next'
import { compose } from 'recompose'

class EditableList extends Component {
	constructor(props) {
		super(props)
		this.state = {
			values: props.values || [],
			newValue: '',
			isLoading: false
		}
	}

	handleNewValueChange = (e, { value }) => {
		this.setState({ newValue: value })
	}

	handleChange = e => {
		e.preventDefault()
		this.setState({ isLoading: true })
		return this.props.onChange(this.state.values).then(values => {
			this.setState({ values, newValue: '' })
		}).finally(() => {
			this.setState({
				isLoading: false
			})
		})
	}

	handleNewValueSubmit = e => {
		this.setState({ newValueLoading: true })
		return this.props.onCreate(this.state.newValue).then(values => {
			this.setState({ values, newValue: '' })
		})
		.finally(() => {
			this.setState({ newValueLoading: false })
		})
	}

	handleDelete = index => {
		return this.props.onDelete(index).then(values => {
			this.setState({ values })
		}).finally(() => {
			this.setState({ isLoading: false })
		})
	}

	handleUpdate = (index, value) => {
		return this.props.onUpdate(index, value).then(values => {
			this.setState({ values })
		}).finally(() => {
			this.setState({ isLoading: false })
		})
	}

	render() {
		const { values, newValue, isLoading } = this.state
		const { idKey, valueKey, t} = this.props
		return <List divided style={{maxWidth: '400px'}}>
			{values.map(value => <List.Item  key={value[idKey]}><EditableItem t={t} value={value[valueKey]} onUpdate={this.handleUpdate.bind(null, value[idKey])} onDelete={this.handleDelete.bind(null, value[idKey])} /></List.Item>)}
			<List.Item>
				<Form onSubmit={this.handleNewValueSubmit}>
					<Input size='small' type='text' loading={isLoading} fluid value={newValue} onChange={this.handleNewValueChange} action={<Button icon='plus' disabled={!newValue} />} />
				</Form>
			</List.Item>
		</List>
	}
}

class EditableItem extends Component {
	constructor(props) {
		super(props)
		this.state = {
			value: props.value,
			isDeleting: false,
			isEditing: false,
			isLoading: false
		}
	}

	componentWillUnmount() {
		this.finishLoading = () => {}
	}

	finishLoading = () => {
		this.setState({ isLoading: false, isEditing: false, isDeleting: false })
	}

	handleEditConfirm = e => {
		e.preventDefault()
		this.setState({ isLoading: true })
		this.props.onUpdate(this.state.value).finally(() => this.finishLoading())
	}

	handleEditChange = (e, { value }) => {
		this.setState({ value })
	}

	handleEditCancel = e => {
		this.setState({ isEditing: false })
	}

	handleEditOpen = e => {
		e.preventDefault()
		this.setState({ isEditing: true })
	}

	handleDeleteConfirm = e => {
		e.preventDefault()
		this.setState({ isLoading: true })
		return this.props.onDelete().finally(() => this.finishLoading())
	}

	handleDeleteClick = e => {
		e.preventDefault()
		this.setState({ isDeleting: true })
	}

	handleCancelDeleteClick = e => {
		e.preventDefault()
		this.setState({ isDeleting: false, isLoading: false })
	}

	render() {
		const { isDeleting, isLoading, isEditing, value } = this.state
		const { t } = this.props
		if (isEditing) {
			return <Form onSubmit={this.handleEditConfirm}>
				<Input size='small' onBlur={this.handleEditCancel} type='text' loading={isLoading} fluid value={value} onChange={this.handleEditChange} action={<Button icon='pencil' />} autoFocus />
			</Form>
		} else if (isDeleting) {
			return <Fragment>
				<Button negative loading={isLoading} onClick={this.handleDeleteConfirm} size='tiny' content={t('chatbot.setting.web.domains.deleteDomain')} />&nbsp;
				{t('chatbot.setting.web.domains.or')}&nbsp;
				<a href='#' onClick={this.handleCancelDeleteClick}>{t('chatbot.setting.web.domains.cancel')}</a>
			</Fragment>
		}
		return <Fragment>
			<List.Content floated='left' onClick={this.handleEditOpen}>
				{value}
			</List.Content>
			<List.Content floated='right'>
				<a href='#' onClick={this.handleDeleteClick}>{t('chatbot.setting.web.domains.delete')}</a>
			</List.Content>
		</Fragment>
	}
}

export default compose(
	translate()
)(EditableList)