import React from 'react'
import { translate } from 'react-i18next'
import AboutForm from 'components/forms/AboutForm'

class AboutPage extends React.Component {
	componentDidMount() {
		document.title = `LingBot | Account`
	}
	render() {
		const { onResetPassword } = this.props
		return <div>
			<AboutForm onResetPassword={onResetPassword} />
		</div>
	}
}

export default translate()(AboutPage)
