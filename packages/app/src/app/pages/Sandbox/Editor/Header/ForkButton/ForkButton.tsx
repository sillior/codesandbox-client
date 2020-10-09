import * as React from 'react';
import { css } from '@styled-system/css';
import {
  Button,
  Menu,
  Icon,
  Stack,
  Text,
  Tooltip,
} from '@codesandbox/components';
import { useOvermind } from 'app/overmind';
import { TeamAvatar } from 'app/components/TeamAvatar';
import { CurrentUser } from '@codesandbox/common/lib/types';
import { MemberAuthorization } from 'app/graphql/types';
import { ForkIcon } from '../icons';

interface TeamItemProps {
  name: string;
  avatar: string | null;
  onSelect: () => void;
}

const TeamItem = (props: TeamItemProps) => (
  <Menu.Item
    style={{
      paddingTop: 8,
      paddingBottom: 8,
      fontWeight: 500,
      opacity: 1,
      cursor: 'pointer',
    }}
    onSelect={props.onSelect}
  >
    <Stack gap={2} align="center">
      <TeamAvatar size="small" avatar={props.avatar} name={props.name} />{' '}
      <Text>{props.name}</Text>
    </Stack>
  </Menu.Item>
);

const DisabledTeamItem = (props: TeamItemProps) => (
  <Menu.Item
    style={{
      paddingTop: 8,
      paddingBottom: 8,
      fontWeight: 500,
      opacity: 0.4,
      cursor: 'not-allowed',
    }}
    onSelect={props.onSelect}
  >
    <Tooltip label="You don't have access to fork sandboxes in this workspace.">
      <Stack gap={2} align="center">
        <TeamAvatar size="small" avatar={props.avatar} name={props.name} />
        <Text>{props.name}</Text>
      </Stack>
    </Tooltip>
  </Menu.Item>
);

interface ITeamItem {
  teamId: string;
  teamName: string;
  teamAvatar: string | null;
  userAuthorizations: MemberAuthorization[];
}

interface TeamOrUserItemProps {
  item: ITeamItem;
  forkClicked: (teamId: string) => void;
  disabled: boolean;
  isPersonal: boolean;
}
const TeamOrUserItem: React.FC<TeamOrUserItemProps> = props => {
  if (props.disabled) {
    return (
      <DisabledTeamItem
        name={props.item.teamName}
        avatar={props.item.teamAvatar}
        onSelect={() => {}}
      />
    );
  }

  return (
    <TeamItem
      onSelect={() => {
        const item = props.item as ITeamItem;
        props.forkClicked(item.teamId);
      }}
      name={props.item.teamName + (props.isPersonal ? ' (Personal)' : '')}
      avatar={props.item.teamAvatar}
    />
  );
};

interface ForkButtonProps {
  variant: 'primary' | 'secondary';
  forkClicked: (teamId?: string | null) => void;
  user: CurrentUser;
}

export const ForkButton: React.FC<ForkButtonProps> = props => {
  const { state } = useOvermind();
  const { user } = props;
  let teams: ITeamItem[] = [];
  let currentSpace: ITeamItem | null = null;
  let otherWorkspaces: ITeamItem[] = [];

  const userSpace = state.dashboard.teams.find(
    t => t.id === state.personalWorkspaceId
  )!;

  const allTeams: {
    id: string;
    name: string;
    avatarUrl: string;
    userAuthorizations: MemberAuthorization[];
  }[] = [
    userSpace,
    ...state.dashboard.teams.filter(t => t.id !== state.personalWorkspaceId),
  ].filter(Boolean);

  if (allTeams.length) {
    teams = allTeams.map(team => ({
      teamId: team.id,
      teamName: team.name,
      teamAvatar: team.avatarUrl,
      userAuthorizations: team.userAuthorizations,
    }));
    currentSpace = teams.find(t => t.teamId === state.activeTeam)!;
    otherWorkspaces = teams.filter(t => t !== currentSpace)!;
  }

  return (
    <Stack>
      {state.activeWorkspaceAuthorization === 'READ' ? null : (
        <Button
          onClick={() => props.forkClicked()}
          loading={state.editor.isForkingSandbox}
          variant={props.variant}
          css={
            otherWorkspaces.length
              ? {
                  width: 'calc(100% - 26px)',
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                }
              : {}
          }
        >
          <ForkIcon css={css({ height: 3, marginRight: 1 })} /> Fork
        </Button>
      )}
      {otherWorkspaces.length ? (
        <Menu>
          <Menu.Button
            variant={props.variant}
            css={
              state.activeWorkspaceAuthorization === 'READ'
                ? {}
                : {
                    width: '26px',
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                  }
            }
          >
            {state.activeWorkspaceAuthorization === 'READ' ? (
              <>
                <ForkIcon css={css({ height: 3, marginRight: 1 })} />{' '}
                <Text css={css({ marginRight: 2 })}>Fork</Text>
              </>
            ) : null}
            <Icon size={8} name="caret" />
          </Menu.Button>
          <Menu.List
            css={css({
              fontSize: 2,
              lineHeight: 1,
            })}
            style={{
              paddingTop: 4,
              paddingBottom: 4,
              marginLeft: '-4rem',
              marginTop: -4,
            }}
          >
            {currentSpace && (
              <TeamOrUserItem
                forkClicked={props.forkClicked}
                item={currentSpace}
                disabled={state.activeWorkspaceAuthorization === 'READ'}
                isPersonal={currentSpace.teamId === state.personalWorkspaceId}
              />
            )}

            <Menu.Divider />
            {otherWorkspaces.map((space, i) => (
              <TeamOrUserItem
                isPersonal={space.teamId === state.personalWorkspaceId}
                key={space.teamId}
                forkClicked={props.forkClicked}
                item={space}
                disabled={
                  space.userAuthorizations.find(
                    authorization => authorization.userId === user.id
                  )?.authorization === 'READ'
                }
              />
            ))}
          </Menu.List>
        </Menu>
      ) : null}
    </Stack>
  );
};
