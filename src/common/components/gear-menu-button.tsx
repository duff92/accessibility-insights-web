// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { NamedFC } from 'common/react/named-fc';
import { IconButton, IContextualMenuItem } from 'office-ui-fabric-react';
import * as React from 'react';
import { DropdownClickHandler } from '../dropdown-click-handler';
import { FeatureFlags } from '../feature-flags';
import { FeatureFlagStoreData } from '../types/store-data/feature-flag-store-data';
import * as styles from './gear-menu-button.scss';

export interface GearMenuButtonProps {
    dropdownClickHandler: DropdownClickHandler;
    featureFlags: FeatureFlagStoreData;
}

export const GearMenuButton = NamedFC<GearMenuButtonProps>('GearOptionsButtonComponent', props => {
    const getMenuItems = () => {
        const menuToReturn: IContextualMenuItem[] = [
            {
                key: 'settings',
                iconProps: {
                    iconName: 'gear',
                },
                onClick: props.dropdownClickHandler.openSettingsPanelHandler,
                name: 'Settings',
            },
            {
                key: 'preview-features',
                iconProps: {
                    iconName: 'giftboxOpen',
                },
                onClick: props.dropdownClickHandler.openPreviewFeaturesPanelHandler,
                name: 'Preview features',
                className: 'preview-features-drop-down-button',
            },
        ];

        if (props.featureFlags[FeatureFlags.scoping]) {
            menuToReturn.push(getScopingFeatureMenuItem());
        }

        return menuToReturn;
    };

    const getScopingFeatureMenuItem = () => {
        return {
            key: 'scoping-feature',
            iconProps: {
                iconName: 'scopeTemplate',
            },
            onClick: props.dropdownClickHandler.openScopingPanelHandler,
            name: 'Scoping',
        };
    };

    return (
        <IconButton
            className={styles.gearMenuButton}
            iconProps={{ iconName: 'Gear' }}
            menuProps={{
                items: getMenuItems(),
                calloutProps: {
                    className: styles.gearMenuButtonCallout,
                },
            }}
            onRenderMenuIcon={() => null}
            ariaLabel="manage settings"
        />
    );
});
