import React from 'react';

import { Tooltip } from '../tooltip/tooltip.component';

export function ButtonTooltip(props: {
  title?: string | React.ReactElement;
  anchorEl?: HTMLElement | null;
  open?: boolean;
}) {
  const {
    title,
    anchorEl,
    open,
  } = props;

  return (
    <Tooltip
      open={open}
      title={title}
      slotProps={{
        popper: {
          anchorEl,
        },
      }}
    >
      {/* tooltip still requires a child — can be dummy */}
      <span/>
    </Tooltip>
  );
}
