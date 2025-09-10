class MediaLocalUtils {
  parseMediaMetadataDuration(mediaMetadataDuration?: number): number {
    // this is the duration we receive from media metadata utility (music-metadata)
    // both parseMediaMetadataDuration and parseMediaPlaybackDuration need to be consistent
    return mediaMetadataDuration ? Math.ceil(mediaMetadataDuration) : 0;
  }

  parseMediaPlaybackDuration(mediaPlaybackDuration?: number): number {
    // this is the duration we receive from media playback utility (howler)
    // both parseMediaMetadataDuration and parseMediaPlaybackDuration need to be consistent
    return mediaPlaybackDuration ? Math.ceil(mediaPlaybackDuration) : 0;
  }
}

export default new MediaLocalUtils();
