import React from 'react';

import './home.component.css';
import * as AppServices from '../../services';

export class HomeComponent extends React.Component<{
  i18nService: AppServices.I18nService;
  collectionService: AppServices.CollectionService;
}> {
  render() {
    const {i18nService, collectionService} = this.props;
    //
    return (
      <div>
        <h2>{i18nService.getString('welcome')}</h2>
        <button type="submit" onClick={() => collectionService.addTracks()}>
          Click here!
        </button>
      </div>
    );
  }
}
