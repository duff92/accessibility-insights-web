// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { NamedFC } from 'common/react/named-fc';
import { FixInstructionProcessor } from 'injected/fix-instruction-processor';
import * as React from 'react';

import { InstanceOutcomeType } from '../../../reports/components/instance-outcome-type';
import { NoFailedInstancesCongrats } from '../../../reports/components/report-sections/no-failed-instances-congrats';
import { UnifiedRuleResult } from './failed-instances-section';
import { RulesWithInstances, RulesWithInstancesDeps } from './rules-with-instances';

export type ResultSectionContentDeps = RulesWithInstancesDeps;

export type ResultSectionContentProps = {
    deps: ResultSectionContentDeps;
    results: UnifiedRuleResult[];
    outcomeType: InstanceOutcomeType;
    fixInstructionProcessor?: FixInstructionProcessor;
};

export const ResultSectionContent = NamedFC<ResultSectionContentProps>(
    'ResultSectionContent',
    ({ results, outcomeType, fixInstructionProcessor, deps }) => {
        if (results.length === 0) {
            return <NoFailedInstancesCongrats />;
        }

        return (
            <RulesWithInstances deps={deps} rules={results} outcomeType={outcomeType} fixInstructionProcessor={fixInstructionProcessor} />
        );
    },
);