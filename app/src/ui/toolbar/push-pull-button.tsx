import * as React from 'react'
import { ToolbarButton, ToolbarButtonStyle } from './button'
import { Progress } from '../../models/progress'
import { Dispatcher } from '../dispatcher'
import { Octicon, OcticonSymbol } from '../octicons'
import { Repository } from '../../models/repository'
import { IAheadBehind } from '../../models/branch'
import { TipState } from '../../models/tip'
import { RelativeTime } from '../relative-time'
import { FetchType } from '../../models/fetch'
import { enablePullWithRebase } from '../../lib/feature-flag'

interface IPushPullButtonProps {
  /**
   * The ahead/behind count for the current branch. If null, it indicates the
   * branch doesn't have an upstream.
   */
  readonly aheadBehind: IAheadBehind | null

  /** The name of the remote. */
  readonly remoteName: string | null

  /** Is a push/pull/fetch in progress? */
  readonly networkActionInProgress: boolean

  /** The date of the last fetch. */
  readonly lastFetched: Date | null

  /** Progress information associated with the current operation */
  readonly progress: Progress | null

  /** The global dispatcher, to invoke repository operations. */
  readonly dispatcher: Dispatcher

  /** The current repository */
  readonly repository: Repository

  /**
   * Indicate whether the current branch is valid, unborn or detached HEAD
   *
   * Used for setting the enabled/disabled and the description text.
   */
  readonly tipState: TipState

  /** Has the user configured pull.rebase to anything? */
  readonly pullWithRebase?: boolean

  /** Is the detached HEAD state related to a rebase or not? */
  readonly rebaseInProgress: boolean
}

function renderAheadBehind(
  progress: Progress | null,
  aheadBehind: IAheadBehind | null
) {
  if (aheadBehind === null || progress !== null) {
    return null
  }

  const { ahead, behind } = aheadBehind
  if (ahead === 0 && behind === 0) {
    return null
  }

  const content: JSX.Element[] = []
  if (ahead > 0) {
    content.push(
      <span key="ahead">
        {ahead}
        <Octicon symbol={OcticonSymbol.arrowSmallUp} />
      </span>
    )
  }

  if (behind > 0) {
    content.push(
      <span key="behind">
        {behind}
        <Octicon symbol={OcticonSymbol.arrowSmallDown} />
      </span>
    )
  }

  return <div className="ahead-behind">{content}</div>
}

function renderLastFetched(lastFetched: Date | null): JSX.Element | string {
  if (lastFetched) {
    return (
      <span>
        Last fetched <RelativeTime date={lastFetched} />
      </span>
    )
  } else {
    return 'Never fetched'
  }
}

function progressButton(
  progress: Progress,
  networkActionInProgress: boolean,
  aheadBehind: IAheadBehind | null
) {
  return (
    <ToolbarButton
      title={progress.title}
      description={progress.description || 'Hang on…'}
      progressValue={progress.value}
      className="push-pull-button"
      icon={OcticonSymbol.sync}
      iconClassName={networkActionInProgress ? 'spin' : ''}
      style={ToolbarButtonStyle.Subtitle}
      tooltip={progress ? progress.description : undefined}
      disabled={true}
    >
      {renderAheadBehind(progress, aheadBehind)}
    </ToolbarButton>
  )
}

function publishRepositoryButton(onClick: () => void) {
  return (
    <ToolbarButton
      title="Publish repository"
      description="Publish this repository to GitHub"
      className="push-pull-button"
      icon={OcticonSymbol.cloudUpload}
      style={ToolbarButtonStyle.Subtitle}
      onClick={onClick}
    />
  )
}

function unbornRepositoryButton() {
  return (
    <ToolbarButton
      title="Publish branch"
      description="Cannot publish unborn HEAD"
      className="push-pull-button"
      icon={OcticonSymbol.cloudUpload}
      style={ToolbarButtonStyle.Subtitle}
      disabled={true}
    />
  )
}

function detachedHeadButton(rebaseInProgress: boolean) {
  const description = rebaseInProgress
    ? 'Rebase in progress'
    : 'Cannot publish detached HEAD'

  return (
    <ToolbarButton
      title="Publish branch"
      description={description}
      className="push-pull-button"
      icon={OcticonSymbol.cloudUpload}
      style={ToolbarButtonStyle.Subtitle}
      disabled={true}
    />
  )
}

function publishBranchButton(isGitHub: boolean, onClick: () => void) {
  const description = isGitHub
    ? 'Publish this branch to GitHub'
    : 'Publish this branch to the remote'

  return (
    <ToolbarButton
      title="Publish branch"
      description={description}
      className="push-pull-button"
      icon={OcticonSymbol.cloudUpload}
      style={ToolbarButtonStyle.Subtitle}
      onClick={onClick}
    />
  )
}

function fetchButton(
  remoteName: string,
  aheadBehind: IAheadBehind,
  lastFetched: Date | null,
  onClick: () => void
) {
  const title = `Fetch ${remoteName}`
  return (
    <ToolbarButton
      title={title}
      description={renderLastFetched(lastFetched)}
      className="push-pull-button"
      icon={OcticonSymbol.sync}
      style={ToolbarButtonStyle.Subtitle}
      onClick={onClick}
    >
      {renderAheadBehind(null, aheadBehind)}
    </ToolbarButton>
  )
}

function pullButton(
  remoteName: string,
  aheadBehind: IAheadBehind,
  lastFetched: Date | null,
  pullWithRebase: boolean,
  onClick: () => void
) {
  const title =
    pullWithRebase && enablePullWithRebase()
      ? `Pull ${remoteName} with rebase`
      : `Pull ${remoteName}`

  return (
    <ToolbarButton
      title={title}
      description={renderLastFetched(lastFetched)}
      className="push-pull-button"
      icon={OcticonSymbol.arrowDown}
      style={ToolbarButtonStyle.Subtitle}
      onClick={onClick}
    >
      {renderAheadBehind(null, aheadBehind)}
    </ToolbarButton>
  )
}

function pushButton(
  remoteName: string,
  aheadBehind: IAheadBehind,
  lastFetched: Date | null,
  onClick: () => void
) {
  const title = `Push ${remoteName}`

  return (
    <ToolbarButton
      title={title}
      description={renderLastFetched(lastFetched)}
      className="push-pull-button"
      icon={OcticonSymbol.arrowUp}
      style={ToolbarButtonStyle.Subtitle}
      onClick={onClick}
    >
      {renderAheadBehind(null, aheadBehind)}
    </ToolbarButton>
  )
}

/**
 * A button which pushes, pulls, or updates depending on the state of the
 * repository.
 */
export class PushPullButton extends React.Component<IPushPullButtonProps, {}> {
  private push = () => {
    this.props.dispatcher.push(this.props.repository)
  }

  private pull = () => {
    this.props.dispatcher.pull(this.props.repository)
  }

  private fetch = () => {
    this.props.dispatcher.fetch(
      this.props.repository,
      FetchType.UserInitiatedTask
    )
  }

  public render() {
    const {
      progress,
      networkActionInProgress,
      aheadBehind,
      remoteName,
      repository,
      tipState,
      rebaseInProgress,
      lastFetched,
      pullWithRebase,
    } = this.props

    if (progress !== null) {
      return progressButton(progress, networkActionInProgress, aheadBehind)
    }

    if (remoteName === null) {
      return publishRepositoryButton(this.push)
    }

    if (tipState === TipState.Unborn) {
      return unbornRepositoryButton()
    }

    if (tipState === TipState.Detached) {
      return detachedHeadButton(rebaseInProgress)
    }

    if (aheadBehind === null) {
      const isGitHub = !!repository.gitHubRepository
      return publishBranchButton(isGitHub, this.push)
    }

    const { ahead, behind } = aheadBehind

    if (ahead === 0 && behind === 0) {
      return fetchButton(remoteName, aheadBehind, lastFetched, this.fetch)
    }

    if (behind > 0) {
      return pullButton(
        remoteName,
        aheadBehind,
        lastFetched,
        pullWithRebase || false,
        this.pull
      )
    }

    return pushButton(remoteName, aheadBehind, lastFetched, this.push)
  }
}
