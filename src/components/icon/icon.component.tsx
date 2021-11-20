import React from 'react';
import classNames from 'classnames';

export function Icon(props: {
  name: string,
  className?: string,
}) {
  const {
    name,
    className,
  } = props;

  return (
    <i className={classNames(name, className)}/>
  );
}
