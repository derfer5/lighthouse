/**
 * @license Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Audit} from './audit.js';
import * as i18n from '../lib/i18n/i18n.js';
import {CumulativeLayoutShift} from '../computed/metrics/cumulative-layout-shift.js';

const UIStrings = {
  /** Descriptive title of a diagnostic audit that provides up to the top five elements contributing to Cumulative Layout Shift. */
  title: 'Avoid large layout shifts',
  /** Description of a diagnostic audit that provides up to the top five elements contributing to Cumulative Layout Shift. The last sentence starting with 'Learn' becomes link text to additional documentation. */
  description: 'These DOM elements contribute most to the CLS of the page. [Learn how to improve CLS](https://web.dev/optimize-cls/)',
  /**  Label for a column in a data table; entries in this column will be the amount that the corresponding element contributes to the total CLS metric score. */
  columnContribution: 'CLS Contribution',
};

const str_ = i18n.createIcuMessageFn(import.meta.url, UIStrings);

class LayoutShiftElements extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: 'layout-shift-elements',
      title: str_(UIStrings.title),
      description: str_(UIStrings.description),
      scoreDisplayMode: Audit.SCORING_MODES.INFORMATIVE,
      guidanceLevel: 2,
      requiredArtifacts: ['traces', 'TraceElements'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const clsElements = artifacts.TraceElements
      .filter(element => element.traceEventType === 'layout-shift');

    const clsElementData = clsElements.map(element => {
      return {
        node: Audit.makeNodeItem(element.node),
        score: element.score,
      };
    });

    /** @type {LH.Audit.Details.Table['headings']} */
    const headings = [
      {key: 'node', valueType: 'node', label: str_(i18n.UIStrings.columnElement)},
      {key: 'score', valueType: 'numeric',
        granularity: 0.001, label: str_(UIStrings.columnContribution)},
    ];

    const details = Audit.makeTableDetails(headings, clsElementData);
    let displayValue;
    if (clsElementData.length > 0) {
      displayValue = str_(i18n.UIStrings.displayValueElementsFound,
        {nodeCount: clsElementData.length});
    }

    const {cumulativeLayoutShift: clsSavings} =
      await CumulativeLayoutShift.request(artifacts.traces[Audit.DEFAULT_PASS], context);

    return {
      score: 1,
      metricSavings: {
        CLS: clsSavings,
      },
      notApplicable: details.items.length === 0,
      displayValue,
      details,
    };
  }
}

export default LayoutShiftElements;
export {UIStrings};
