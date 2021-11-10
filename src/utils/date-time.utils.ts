import moment from 'moment';

export function formatSecondsToDuration(seconds: number): string {
  const formatted = moment
    .utc(seconds * 1000, 'x')
    .format('HH:mm:ss');

  // remove 00s belonging to hours component if empty
  return formatted.replace(/^00:/, '');
}
