import React from 'react';
import PropTypes from 'prop-types';
import InlineMessage from '../messages/InlineMessage';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { translate } from 'react-i18next';
import { fetchPackages } from 'actions/user';
import {
  Form,
  Checkbox,
  Divider,
  Container,
  Message,
  Label
} from 'semantic-ui-react';
import toJS from 'components/utils/ToJS'

class CreateBotForm extends React.Component {

  state = {
    loading: false,
    errors: this.props.errors
  }

  static getDerivedStateFromProps(props) {
    return {errors: props.errors}
  }

  componentWillMount() {
    this.setState({ loading: true });
    this.props.fetchPackages()
      .then( () => {
        this.setState({ loading: false });
        console.log('Load packages successfully.');
      })
      .catch(err => err.response.data.errors)
      .then(err => {
        console.log('Failed to load packages.');
        this.setState({ loading: false });
        this.packages = <div />;
      });
  }

  render = () => {
    const {
      t,
      packages,
      errors,
      onChange,
      onPackageSelect,
      packageSelect,
      data
    } = this.props;

    const paddingStyle = {
      padding: '10px'
    }

    const allowedLanguages = ['tw', 'cn']

    if (packages) {
      this.packages = packages.map( (pkg, ix) => (
        <Checkbox
          radio
          key={ix}
          style={paddingStyle}
          onChange={onPackageSelect}
          value={pkg.id}
          checked={packageSelect === pkg.id}
          label={`${pkg.name}: ${pkg.price}`}
        >
        </Checkbox>
      ));
    }

    return (
      <Container>
        <Form>
          <Form.Field>
            <Form.Input
              maxLength={15}
              type='text'
              name='robotName'
              label={t('chatbot.name')}
              placeholder={t('chatbot.placeholder.name')}
              error={errors.robotName ? true : false}
              onChange={onChange}
            >
            </Form.Input>
            {errors.robotName && <Label basic color='red' pointing>{errors.robotName}</Label>}
          </Form.Field>
          <Form.Field>
            <Form.Input
              type='text'
              name='greetingMsg'
              label={t('chatbot.greetingMsg')}
              maxLength={50}
              placeholder={t('chatbot.placeholder.greetingMsg')}
              error={errors.greetingMsg ? true : false}
              onChange={onChange}
              onChange={onChange}
            >
            </Form.Input>
            {errors.greetingMsg && <Label basic color='red' pointing>{errors.greetingMsg}</Label>}
          </Form.Field>
          <Form.Field>
            <Form.Input
              type='text'
              name='failedMsg'
              maxLength={50}
              label={t('chatbot.failedMsg')}
              placeholder={t('chatbot.placeholder.failedMsg')}
              error={errors.failedMsg ? true : false}
              onChange={onChange}
            >
            </Form.Input>
            {errors.failedMsg && <Label basic color='red' pointing>{errors.failedMsg}</Label>}
          </Form.Field>
          <Form.Field>
            <Form.Group inline>
              <label>{t('chatbot.selectLanguage')}</label>
              {
                allowedLanguages.map(el => <Form.Radio
                  name='language'
                  key={`chatbot.language.${el}`}
                  label={t(`chatbot.language.${el}`)}
                  value={el}
                  checked={data.language === el}
                  onChange={onChange}
                  error={errors.language ? true : false}
                />)
              }
              {errors.language && <Label basic color='red' pointing='left'>{errors.language}</Label>}
            </Form.Group>
          </Form.Field>
        </Form>
        <Divider section horizontal>{t('chatbot.pricing.text')}</Divider>
        <Form.Field error={!!errors.package}>
          {errors.package && <InlineMessage text={errors.package}/>}
          {this.packages}
        </Form.Field>
      </Container>
    )
  }
}

CreateBotForm.propTypes = {
  onChange: PropTypes.func.isRequired,
  onPackageSelect: PropTypes.func.isRequired,
  data: PropTypes.object
}

const mapStateToProps = (state) => ({
  packages: state.getIn(['user', 'packages'])
});

export default compose(
  translate('translations'),
  connect(mapStateToProps, { fetchPackages }),
  toJS
)(CreateBotForm);
