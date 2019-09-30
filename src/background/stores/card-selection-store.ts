// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { StoreNames } from '../../common/stores/store-names';
import { CardSelectionData, CardSelectionStoreData, RuleExpandCollapseData } from '../../common/types/store-data/card-selection-store-data';
import { UnifiedScanCompletedPayload } from '../actions/action-payloads';
import { CardSelectionActions } from '../actions/card-selection-actions';
import { BaseStoreImpl } from './base-store-impl';

export class CardSelectionStore extends BaseStoreImpl<CardSelectionStoreData> {
    constructor(private readonly cardSelectionActions: CardSelectionActions) {
        super(StoreNames.CardSelectionStore);
    }

    protected addActionListeners(): void {
        this.cardSelectionActions.toggleRuleExpandCollapse.addListener(this.toggleRuleExpandCollapse);
        this.cardSelectionActions.toggleCardSelection.addListener(this.toggleCardSelection);
        this.cardSelectionActions.collapseAllRules.addListener(this.CollapseAllRules);
        this.cardSelectionActions.scanCompleted.addListener(this.onScanCompleted);
    }

    public getDefaultState(): CardSelectionStoreData {
        const defaultValue: CardSelectionStoreData = {
            rules: null,
        };

        return defaultValue;
    }

    public toggleRuleExpandCollapse(): void {}

    public toggleCardSelection(): void {}

    public CollapseAllRules(): void {}

    private onScanCompleted = (payload: UnifiedScanCompletedPayload): void => {
        // this.state.results = payload.scanResult;
        // this.state.rules = payload.rules;
        this.emitChanged();
    };
}
