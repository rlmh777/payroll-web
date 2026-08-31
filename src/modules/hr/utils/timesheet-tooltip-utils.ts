import { timesheetLastUpdatedTooltip } from '@payroll/components/attendance/utils';

export function timesheetCommentLine(row: { comment?: string | null }): string | null {
  const comment = (row.comment || '').trim();
  return comment ? `Comment: ${comment}` : null;
}

export function joinTimesheetTooltipSections(...sections: Array<string | null | undefined>): string {
  return sections
    .map((section) => section?.trim())
    .filter((section): section is string => Boolean(section))
    .join('\n\n');
}

export function timesheetRowMetadataTooltip(row: {
  comment?: string | null;
  updatedByName?: string | null;
  updatedAt?: string | null;
}): string {
  return joinTimesheetTooltipSections(
    timesheetLastUpdatedTooltip(row),
    timesheetCommentLine(row),
  );
}

export function timesheetPrimaryWithCommentTooltip(
  row: { comment?: string | null },
  primaryMessage?: string | null,
): string {
  return joinTimesheetTooltipSections(primaryMessage, timesheetCommentLine(row));
}
