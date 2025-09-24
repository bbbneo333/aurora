import { getPercentFromPosition, getPercentFromValue } from './progress-bar.utils';

export enum ProgressStateActionType {
  Update = 'progress/update',
  StartDrag = 'progress/startDrag',
  UpdateDrag = 'progress/updateDrag',
  EndDrag = 'progress/endDrag',
  CommitDrag = 'progress/commitDrag',
  Jump = 'progress/jump',
}

export type ProgressState = {
  mediaProgressIsDragging: boolean;
  mediaProgressDragPercent: number;
  mediaProgressUncommittedDragPercent: number | undefined,
};

export type ProgressStateAction = {
  type: ProgressStateActionType,
  data?: any;
};

export enum ProgressJumpDirection {
  Left = 'progress/jump/left',
  Right = 'progress/jump/right',
}

export function progressStateReducer(state: ProgressState, action: ProgressStateAction): ProgressState {
  switch (action.type) {
    case ProgressStateActionType.Update: {
      const {
        mediaProgress,
        mediaProgressMaxValue,
      } = action.data;

      const mediaProgressDragPercent = getPercentFromValue(mediaProgress, mediaProgressMaxValue);

      return {
        ...state,
        mediaProgressDragPercent,
      };
    }
    case ProgressStateActionType.StartDrag: {
      return {
        ...state,
        mediaProgressIsDragging: true,
      };
    }
    case ProgressStateActionType.UpdateDrag: {
      const {
        eventPositionX,
        mediaProgressBarContainerRef,
        mediaProgressMaxValue,
      } = action.data;

      // if any of the required references is missing, do nothing, this is just for safety and won't likely happen
      if (!mediaProgressBarContainerRef || !mediaProgressBarContainerRef.current) {
        return state;
      }

      const mediaProgressContainerElement = (mediaProgressBarContainerRef.current as unknown as HTMLDivElement);
      const mediaProgressUncommittedDragPercent = getPercentFromPosition(eventPositionX, mediaProgressContainerElement, mediaProgressMaxValue);

      // we won't be doing anything in case the computed progress value is same
      if (mediaProgressUncommittedDragPercent === state.mediaProgressDragPercent) {
        return state;
      }

      return {
        ...state,
        mediaProgressUncommittedDragPercent,
      };
    }
    case ProgressStateActionType.EndDrag: {
      return {
        ...state,
        mediaProgressIsDragging: false,
      };
    }
    case ProgressStateActionType.Jump: {
      const {
        eventPositionX,
        eventDirection,
        mediaProgressBarContainerRef,
        mediaProgressMaxValue,
      } = action.data;

      if (state.mediaProgressIsDragging) {
        throw Error('MediaProgressBarComponent encountered error at MediaProgressJump - Progress handler is currently dragging');
      }
      if (state.mediaProgressUncommittedDragPercent !== undefined) {
        throw Error('MediaProgressBarComponent encountered error at MediaProgressJump - Progress handler has existing uncommitted drag');
      }

      // if any of the required references is missing, do nothing, this is just for safety and won't likely happen
      if (!mediaProgressBarContainerRef || !mediaProgressBarContainerRef.current) {
        return state;
      }
      const mediaProgressContainerElement = (mediaProgressBarContainerRef.current as unknown as HTMLDivElement);

      // progress can be jumped in following ways:
      // - via providing event position (x axis)
      // - via providing event direction (left / right)
      let mediaProgressUncommittedDragPercent;

      if (eventPositionX) {
        mediaProgressUncommittedDragPercent = getPercentFromPosition(eventPositionX, mediaProgressContainerElement, mediaProgressMaxValue);
      } else if (eventDirection) {
        if (eventDirection === ProgressJumpDirection.Left) {
          mediaProgressUncommittedDragPercent = Math.max(state.mediaProgressDragPercent - 10, 0);
        } else {
          mediaProgressUncommittedDragPercent = Math.min(state.mediaProgressDragPercent + 10, 100);
        }
      }

      // we won't be doing anything in case the progress value could not be calculated or is same
      if (mediaProgressUncommittedDragPercent === undefined || mediaProgressUncommittedDragPercent === state.mediaProgressDragPercent) {
        return state;
      }

      return {
        ...state,
        mediaProgressUncommittedDragPercent,
      };
    }
    case ProgressStateActionType.CommitDrag: {
      const {
        mediaProgressPercent,
      } = action.data;

      return {
        ...state,
        mediaProgressDragPercent: mediaProgressPercent,
        mediaProgressUncommittedDragPercent: undefined,
      };
    }
    default:
      return state;
  }
}
