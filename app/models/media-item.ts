import {IMediaItem} from '../interfaces';

export class MediaItem implements IMediaItem {
  id: string;
  track_name: string;

  constructor(data: { id: any; track_name: any; }) {
    this.id = data.id;
    this.track_name = data.track_name;
  }
}
