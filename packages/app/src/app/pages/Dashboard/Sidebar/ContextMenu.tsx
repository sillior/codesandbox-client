import React from 'react';
import { useOvermind } from 'app/overmind';
import { useHistory, useLocation } from 'react-router-dom';
import { Stack, Menu, Icon, Text } from '@codesandbox/components';
import track from '@codesandbox/common/lib/utils/analytics';
import { dashboard as dashboardUrls } from '@codesandbox/common/lib/utils/url-generator';
import { Position } from '../Components/Selection';
import { DashboardBaseFolder } from '../types';
import { NEW_FOLDER_ID } from './constants';

const Context = React.createContext({
  setVisibility: null,
});

interface ContextMenuProps {
  activeTeam: string | null;
  authorization: string | null;
  visible: boolean;
  setVisibility: (val: boolean) => void;
  position: Position;
  folder: DashboardBaseFolder;
  setRenaming: (val: boolean) => void;
  setNewFolderPath: (val: string) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  activeTeam,
  authorization,
  visible,
  position,
  setVisibility,
  folder,
  setRenaming,
  setNewFolderPath,
}) => {
  const { actions } = useOvermind();
  const history = useHistory();
  const location = useLocation();

  if (!visible || !folder) return null;

  let menuOptions;

  if (folder.name === 'Drafts' || authorization === 'READ') {
    menuOptions = (
      <MenuItem onSelect={() => {}}>
        <Stack gap={1}>
          <Icon name="lock" size={14} />
          <Text>Protected</Text>
        </Stack>
      </MenuItem>
    );
  } else if (folder.name === 'All Sandboxes') {
    menuOptions = (
      <MenuItem onSelect={() => setNewFolderPath(`/${NEW_FOLDER_ID}`)}>
        New folder
      </MenuItem>
    );
  } else {
    menuOptions = (
      <>
        <MenuItem
          onSelect={() => setNewFolderPath(`${folder.path}/${NEW_FOLDER_ID}`)}
        >
          New folder
        </MenuItem>
        <MenuItem onSelect={() => setRenaming(true)}>Rename folder</MenuItem>
        <MenuItem
          onSelect={() => {
            actions.dashboard.deleteFolder({ path: folder.path });

            const isCurrentlyOpened =
              dashboardUrls.allSandboxes(folder.path) === location.pathname;

            if (isCurrentlyOpened) {
              // navigate out of folder when it's deleted
              const parentFolder = folder.path
                .split('/')
                .slice(0, -1)
                .join('/');
              history.push(
                dashboardUrls.allSandboxes(parentFolder, activeTeam)
              );
            }

            track('Dashboard - Delete folder', {
              source: 'Sidebar',
              dashboardVersion: 2,
            });
          }}
        >
          Delete folder
        </MenuItem>
      </>
    );
  }

  return (
    <Menu.ContextMenu
      visible={visible}
      setVisibility={setVisibility}
      position={position}
      style={{ width: 120 }}
    >
      <Context.Provider value={{ setVisibility }}>
        {menuOptions}
      </Context.Provider>
    </Menu.ContextMenu>
  );
};

const MenuItem = ({ onSelect, ...props }) => {
  const { setVisibility } = React.useContext(Context);
  return (
    <Menu.Item
      onSelect={() => {
        onSelect();
        setVisibility(false);
      }}
      {...props}
    />
  );
};
