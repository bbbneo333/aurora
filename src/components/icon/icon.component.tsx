import React from 'react';
import classNames from 'classnames';

import { Badge, BadgeProps } from '../badge/badge.component';
import { Tooltip } from '../tooltip/tooltip.component';

export type IconProps = {
  name: string;
  className?: string;
  tooltip?: string;
  badge?: BadgeProps | boolean;
};

export function Icon(props: IconProps) {
  const {
    name,
    className,
    tooltip,
    badge,
  } = props;

  let icon = (<i className={classNames('icon', name, className)}/>);

  if (tooltip) {
    icon = (<Tooltip title={tooltip}>{icon}</Tooltip>);
  }

  if (badge) {
    icon = (
      <Badge>
        {icon}
      </Badge>
    );
  }

  return (
    icon
  );
}
