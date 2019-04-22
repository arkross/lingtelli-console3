import React from 'react';
import { Link } from 'react-router-dom';
import {
  Input,
  Form,
  Button,
  Segment,
  Message,
  Radio,
  Image,
  Header
} from 'semantic-ui-react';
import Validator from 'validator';
import propTypes from 'prop-types';
import InlineError from 'components/messages/InlineError';
import logo from 'styles/img/logo.png'
import { translate } from 'react-i18next';


class RegisterForm extends React.Component {
  constructor(props) {
    super(props)
    const browserLang = (window.navigator.language || window.navigator.userLanguage || 'zh-TW')
    let defLanguage = 'tw'
    if (browserLang.toLowerCase().indexOf('cn') >= 0) {
      defLanguage = 'cn'
    } else if (browserLang.toLowerCase().indexOf('en') >= 0) {
      defLanguage = 'en'
    }
    let i18Val = 'zh-TW'
    if (defLanguage.toLowerCase().indexOf('cn') >= 0) {
      i18Val = 'zh-CN'
    } else if (defLanguage.toLowerCase().indexOf('en') >= 0) {
      i18Val = 'en'
    }
    localStorage.setItem('i18nextLng', i18Val)
    props.i18n.changeLanguage(i18Val)
    this.state = {
      data: {
        nickname: '',
        email: '',
        password: '',
        password2: '',
        language: defLanguage
      },
      errors: {},
      loading: false,
    }
  }

  onChange = (e, { name, value }) => {
    if (name === 'language') {
      let i18Val = 'zh-TW'
      if (value.toLowerCase().indexOf('cn') >= 0) {
        i18Val = 'zh-CN'
      } else if (value.toLowerCase().indexOf('en') >= 0) {
        i18Val = 'en'
      }
      localStorage.setItem('i18nextLng', i18Val)
      this.props.i18n.changeLanguage(i18Val)
    }
    this.setState({
      data: {...this.state.data, [name]: value }
    })
  }

  onSubmit = () => {
    const errors = this.validate(this.state.data);
    this.setState({ errors });

    if (Object.keys(errors).length === 0) {
      this.setState({ loading: true });
      this.props
        .submit(this.state)
        .then(() => {
          this.setState({ loading: false });
          this.props.history.push({
            pathname: '/confirmation',
            state: { username: this.state.data.email }
          });
        } ,err => {
          if (err.message) {
            return this.setState({
              errors: {api: err.message},
              loading: false
            })
          }
          return this.setState({
            errors: { api: err.response.data.errors },
            loading: false
          })
        });
    }
  }

  validate = (data) => {
    const errors = {}
    const { t } = this.props


    if (!data.email)
      errors.email = t('errors.mail.blank')
    else if (!Validator.isEmail(data.email))
      errors.email = t('errors.mail.invalid')

    if (!data.nickname)
      errors.username = t('errors.nickname')
    if (!data.password)
      errors.password = t('errors.password.blank')
    if (!data.password2)
      errors.password2 = t('errors.password2.blank')
    if (data.password !== data.password2)
      errors.password2 = t('errors.password2.invalid')

    return errors
  }

  render() {
    const { t } = this.props
    const { errors, loading, data } = this.state
    const languages = [
      {value: 'tw', label: '繁體中文'},
      {value: 'cn', label: '简体中文'},
      {value: 'en', label: 'English'}
    ]

    return (
      <div className='register-container'>
        <Segment loading={loading} textAlign='center'>
          <h2> <Image src={logo} inline size='mini' /> Lingtelli Chatbot </h2>
          <Header as='h3'>{t('register.title')}</Header>
          {errors.api && (
            <Message negative>
              <p>{errors.api}</p>
            </Message>
          )}
          <Form size='small' onSubmit={this.onSubmit}>
            <Form.Field error={!!errors.username}>
              <Input
                icon='user'
                iconPosition='left'
                type='text'
                name='nickname'
                placeholder={t('register.nickname')}
                onChange={this.onChange}
                value={data.nickname}
                maxLength={30}
              />
              {errors.username && <InlineError text={errors.username} />}
            </Form.Field>
            <Form.Field error={!!errors.email}>
              <Input
                icon='mail'
                iconPosition='left'
                type='email'
                name='email'
                placeholder={t('register.mail')}
                onChange={this.onChange}
                value={data.email}
              />
              {errors.email && <InlineError text={errors.email} />}
            </Form.Field>
            <Form.Field error={!!errors.password}>
              <Input
                icon='lock'
                iconPosition='left'
                type='password'
                name='password'
                placeholder={t('register.password')}
                onChange={this.onChange}
                value={data.password}
              />
              {errors.password && <InlineError text={errors.password} />}
            </Form.Field>
            <Form.Field error={!!errors.password2}>
              <Input
                icon='lock'
                iconPosition='left'
                type='password'
                name='password2'
                placeholder={t('register.password2')}
                onChange={this.onChange}
                value={data.password2}
              />
              {errors.password2 && <InlineError text={errors.password2} />}
            </Form.Field>
            <Form.Group inline>
              {languages.map(el => 
                <Form.Radio
                  key={el.value}
                  label={el.label}
                  value={el.value}
                  checked={data.language === el.value}
                  name='language'
                  onChange={this.onChange}
                />
              )}
            </Form.Group>
            <Button fluid color='teal'>{t('register.registerBtn')}</Button>
          </Form>
          <Message size='small'>
            {t('register.description.context')}
            <Link to='/login'>{t('register.description.title')}</Link>
          </Message>
        </Segment>
      </div>
    )
  }
}

RegisterForm.propTypes = {
  submit: propTypes.func.isRequired
}

export default translate('translations')(RegisterForm);
