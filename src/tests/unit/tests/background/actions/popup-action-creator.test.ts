// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { PopupInitializedPayload } from 'background/actions/action-payloads';
import { PopupActionCreator } from 'background/actions/popup-action-creator';
import { TabActions } from 'background/actions/tab-actions';
import { TelemetryEventHandler } from 'background/telemetry/telemetry-event-handler';
import {
    POPUP_INITIALIZED,
    TelemetryEventSource,
    TriggeredBy,
} from 'common/extension-telemetry-events';
import { Messages } from 'common/messages';
import { IMock, Mock, Times } from 'typemoq';

import {
    createActionMock,
    createInterpreterMock,
} from '../global-action-creators/action-creator-test-helpers';

describe('PopupActionCreator', () => {
    it('handles Messages.Popup.Initialized', () => {
        const payload: PopupInitializedPayload = {
            telemetry: {
                triggeredBy: 'test' as TriggeredBy,
                source: TelemetryEventSource.AdHocTools,
            },
            tab: {
                id: -1,
                title: 'test tab title',
                url: 'test url',
            },
        };

        const actionMock = createActionMock(payload.tab);
        const actionsMock = createTabActionsMock('newTabCreated', actionMock.object);
        const interpreterMock = createInterpreterMock(Messages.Popup.Initialized, payload);
        const telemetryEventHandlerMock = Mock.ofType<TelemetryEventHandler>();
        const testSubject = new PopupActionCreator(
            interpreterMock.object,
            actionsMock.object,
            telemetryEventHandlerMock.object,
        );

        testSubject.registerCallbacks();

        actionMock.verifyAll();
        telemetryEventHandlerMock.verify(
            tp => tp.publishTelemetry(POPUP_INITIALIZED, payload),
            Times.once(),
        );
    });

    function createTabActionsMock<ActionName extends keyof TabActions>(
        actionName: ActionName,
        action: TabActions[ActionName],
    ): IMock<TabActions> {
        const actionsMock = Mock.ofType<TabActions>();
        actionsMock.setup(actions => actions[actionName]).returns(() => action);
        return actionsMock;
    }
});
