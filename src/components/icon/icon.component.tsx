import React from 'react';
import classNames from 'classnames';

import { Tooltip } from '../tooltip/tooltip.component';

export function Icon(props: {
  name: string,
  className?: string,
  tooltip?: string,
}) {
  const {
    name,
    className,
    tooltip,
  } = props;

  function icon() {
    return <i className={classNames('icon', name, className)}/>;
  }

  if (tooltip) {
    return (
      <Tooltip title={tooltip}>
        {icon()}
      </Tooltip>
    );
  }

  return (
    icon()
  );
}
