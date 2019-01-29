import React from 'react';
import queryString from 'query-string';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { translate } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Message, Icon } from 'semantic-ui-react';
import { confirm } from 'actions/auth';

/* Validate the email */
class ValidationPage extends React.Component {
  state = {
    loading: true,
    success: false
  }

  componentDidMount = () => {
    const { search } = this.props.location;

    const query = queryString.parse(search);

    this.props.confirm(query.code)
      .then( () => this.setState({ loading:false, success: true }))
      .catch( () => this.setState({ loading: false, success: false }));
  }

  render = () => {
    const { t } = this.props;
    const { loading, success } = this.state;
    return (
      <div>
        {loading &&
          <Message icon>
            <Icon name='circle notched' loading />
            <Message.Header>{t('account.validation.loading')}</Message.Header>
          </Message>
        }

        {!loading && success &&
          <Message success icon>
            <Icon name='checkmark'/>
            <Message.Header>{t('account.validation.success')}</Message.Header>
            <Message.Content>
              <Link to='/login'>{t('account.validation.login')}</Link>
            </Message.Content>
          </Message>
        }

        {!loading && !success &&
          <Message negative icon>
            <Icon name='warning sign'/>
            <Message.Header>{t('account.validation.fail')}</Message.Header>
          </Message>
        }
      </div>
    )
  }
}

export default compose(
  translate('translations'),
  connect(null, { confirm })
)(ValidationPage);
