import React from 'react';

import './home.component.css';
import {I18nService} from '../../services';

export class HomeComponent extends React.Component<{
  i18nService: I18nService;
}> {
  render() {
    const {i18nService} = this.props;
    //
    return (
      <div>
        <h2>{i18nService.getString('welcome')}</h2>
      </div>
    );
  }
}
