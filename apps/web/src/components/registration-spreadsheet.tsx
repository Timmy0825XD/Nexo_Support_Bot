'use client';

import {
  createUpdateRegistrationSchema,
  getParticipantCount,
  getParticipantRoleLabel,
  REGISTRATION_STATUSES,
  requiresManualTeamName,
  type RegistrationResponse,
  type RegistrationStatus,
  type TournamentFormat,
} from '@mw-platform/shared';
import { useCallback, useMemo, useState } from 'react';
import { listRegistrationsAdmin, updateRegistrationAdmin } from '../lib/admin-api';
import { exportRegistrationsToExcel } from '../lib/export-registrations';
import {
  CURRENT_TITLES,
  formatDisplayDate,
  isTeamRowDirty,
  PARTICIPANT_FIELD_DEFS,
  registrationsToTeamRows,
  teamRowToRegistrationUpdate,
  type TeamParticipant,
  type TeamSpreadsheetRow,
} from '../lib/registration-rows';
import { RegistrationManagerEmpty } from './registration-manager-empty';
import { Icon } from './ui/icon';
import { ToastStack, type ToastItem } from './ui/toast-stack';

interface RegistrationSpreadsheetProps {
  tournamentId: string;
  tournamentName: string;
  format: TournamentFormat;
  initialRegistrations: RegistrationResponse[];
}

type ParticipantFieldKey = 'discordTag' | 'discordId' | 'inGameName' | 'inGameId' | 'currentTitle';
type HeaderGroup = 'team' | 'captain' | 'player' | 'meta';

const FIELD_MIN_WIDTH: Record<ParticipantFieldKey, number> = {
  discordTag: 160,
  discordId: 260,
  inGameName: 190,
  inGameId: 240,
  currentTitle: 160,
};

interface GridColumn {
  id: string;
  label: string;
  group: HeaderGroup;
  minWidth: number;
  kind: 'teamName' | 'status' | 'flagged' | 'participant' | 'createdAt' | 'updatedAt';
  slotIndex?: number;
  fieldKey?: ParticipantFieldKey;
}

function statusSelectClass(status: RegistrationStatus) {
  switch (status) {
    case 'confirmed':
      return 'text-tertiary';
    case 'pending':
      return 'text-amber-400';
    case 'rejected':
      return 'text-error';
  }
}

function headerGroupClass(group: HeaderGroup) {
  return `spreadsheet-grid-header spreadsheet-grid-header-${group}`;
}

function buildGridColumns(participantCount: number): GridColumn[] {
  const columns: GridColumn[] = [
    { id: 'teamName', label: 'Team Name', group: 'team', minWidth: 220, kind: 'teamName' },
    { id: 'status', label: 'Status', group: 'team', minWidth: 150, kind: 'status' },
    { id: 'flagged', label: 'Flagged for Review', group: 'team', minWidth: 150, kind: 'flagged' },
  ];

  for (let slotIndex = 0; slotIndex < participantCount; slotIndex++) {
    const roleLabel = getParticipantRoleLabel(slotIndex);
    const group: HeaderGroup = slotIndex === 0 ? 'captain' : 'player';

    for (const field of PARTICIPANT_FIELD_DEFS) {
      columns.push({
        id: `${slotIndex}-${field.key}`,
        label: `${roleLabel} ${field.label}`,
        group,
        minWidth: FIELD_MIN_WIDTH[field.key],
        kind: 'participant',
        slotIndex,
        fieldKey: field.key,
      });
    }
  }

  columns.push(
    { id: 'createdAt', label: 'Registered At', group: 'meta', minWidth: 220, kind: 'createdAt' },
    { id: 'updatedAt', label: 'Last Modified', group: 'meta', minWidth: 220, kind: 'updatedAt' },
  );

  return columns;
}

export function RegistrationSpreadsheet({
  tournamentId,
  tournamentName,
  format,
  initialRegistrations,
}: RegistrationSpreadsheetProps) {
  const showTeamName = requiresManualTeamName(format);
  const participantCount = getParticipantCount(format);

  const [rows, setRows] = useState(() => registrationsToTeamRows(initialRegistrations));
  const [baselineRows, setBaselineRows] = useState(() =>
    registrationsToTeamRows(initialRegistrations),
  );
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const gridColumns = useMemo(() => buildGridColumns(participantCount), [participantCount]);
  const updateSchema = useMemo(() => createUpdateRegistrationSchema(format), [format]);

  const stats = useMemo(() => {
    const counts = { pending: 0, confirmed: 0, rejected: 0, flagged: 0 };
    for (const row of rows) {
      counts[row.status] += 1;
      if (row.flaggedForReview) counts.flagged += 1;
    }
    return counts;
  }, [rows]);

  const baselineByKey = useMemo(
    () => new Map(baselineRows.map((row) => [row.key, row])),
    [baselineRows],
  );

  const dirtyRegistrationIds = useMemo(() => {
    const ids = new Set<string>();
    for (const row of rows) {
      if (isTeamRowDirty(row, baselineByKey.get(row.key))) {
        ids.add(row.registrationId);
      }
    }
    return ids;
  }, [rows, baselineByKey]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string) => {
    setToasts([{ id: `${Date.now()}`, message }]);
  }, []);

  const updateTeamField = useCallback(
    (
      registrationId: string,
      patch: Partial<Pick<TeamSpreadsheetRow, 'teamName' | 'status' | 'flaggedForReview'>>,
    ) => {
      setRows((current) =>
        current.map((row) =>
          row.registrationId === registrationId ? { ...row, ...patch } : row,
        ),
      );
    },
    [],
  );

  const updateParticipantField = useCallback(
    (
      registrationId: string,
      slotIndex: number,
      field: ParticipantFieldKey,
      value: string,
    ) => {
      setRows((current) =>
        current.map((row) => {
          if (row.registrationId !== registrationId) return row;
          return {
            ...row,
            participants: row.participants.map((participant) =>
              participant.slotIndex === slotIndex
                ? { ...participant, [field]: value }
                : participant,
            ),
          };
        }),
      );
    },
    [],
  );

  const getParticipant = (row: TeamSpreadsheetRow, slotIndex: number): TeamParticipant => {
    return (
      row.participants.find((participant) => participant.slotIndex === slotIndex) ?? {
        slotIndex,
        role: getParticipantRoleLabel(slotIndex),
        discordTag: '',
        discordId: '',
        inGameName: '',
        inGameId: '',
        currentTitle: 'Untitled',
      }
    );
  };

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await listRegistrationsAdmin(tournamentId);
      const nextRows = registrationsToTeamRows(data.registrations);
      setRows(nextRows);
      setBaselineRows(nextRows);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to refresh registrations.');
    } finally {
      setRefreshing(false);
    }
  }, [showToast, tournamentId]);

  const saveChanges = useCallback(async () => {
    if (dirtyRegistrationIds.size === 0) return;

    setSaving(true);
    setToasts([]);

    try {
      let savedCount = 0;
      for (const registrationId of dirtyRegistrationIds) {
        const row = rows.find((entry) => entry.registrationId === registrationId);
        if (!row) continue;

        const payload = teamRowToRegistrationUpdate(row, format);
        const parsed = updateSchema.safeParse(payload);
        if (!parsed.success) {
          const message = parsed.error.errors.map((issue) => issue.message).join('; ');
          throw new Error(`${row.teamName}: ${message}`);
        }

        await updateRegistrationAdmin(registrationId, payload);
        savedCount += 1;
      }

      const refreshed = await listRegistrationsAdmin(tournamentId);
      const nextRows = registrationsToTeamRows(refreshed.registrations);
      setRows(nextRows);
      setBaselineRows(nextRows);
      showToast(`Saved ${savedCount} registration(s) successfully.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }, [dirtyRegistrationIds, format, rows, showToast, tournamentId, updateSchema]);

  const handleExport = useCallback(() => {
    exportRegistrationsToExcel(rows, tournamentName, format);
  }, [format, rows, tournamentName]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="flex flex-col">
          <p className="text-label-sm mb-1 tracking-widest text-primary uppercase">
            Registration Manager
          </p>
          <h1 className="text-4xl font-black tracking-tight text-on-surface md:text-5xl">
            {tournamentName}
          </h1>
          <p className="text-body-md mt-1 text-on-surface-variant">
            Format: <span className="font-medium text-on-surface">{format.toUpperCase()}</span>
            {' · '}
            <span className="font-medium text-on-surface">
              {rows.length} team{rows.length === 1 ? '' : 's'}
            </span>{' '}
            registered
          </p>

          {rows.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <StatChip dotClass="bg-amber-400" label={`Pending: ${stats.pending}`} />
              <StatChip dotClass="bg-tertiary" label={`Confirmed: ${stats.confirmed}`} />
              <StatChip dotClass="bg-error" label={`Rejected: ${stats.rejected}`} />
              <StatChip
                dotClass="bg-primary-container animate-pulse"
                label={`Flagged: ${stats.flagged}`}
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing || saving}
            className="text-label-sm flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2.5 font-medium text-on-surface transition-all hover:bg-surface-container-high active:scale-95 disabled:opacity-50"
          >
            <Icon name="refresh" className={refreshing ? 'animate-spin text-[20px]' : 'text-[20px]'} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={rows.length === 0}
            className="text-label-sm flex items-center gap-2 rounded-lg border border-tertiary/30 bg-tertiary/10 px-4 py-2.5 font-medium text-tertiary transition-all hover:bg-tertiary/20 active:scale-95 disabled:opacity-50"
          >
            <Icon name="file_download" className="text-[20px]" />
            Export Excel
          </button>

          <button
            type="button"
            onClick={saveChanges}
            disabled={saving || dirtyRegistrationIds.size === 0 || rows.length === 0}
            className="relative flex items-center gap-2 rounded-lg bg-primary-container px-6 py-2.5 text-label-sm font-bold text-on-primary-container shadow-lg shadow-primary-container/20 transition-all hover:bg-inverse-primary active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon
              name={saving ? 'refresh' : 'save'}
              className={saving ? 'animate-spin text-[20px]' : 'text-[20px]'}
            />
            {saving ? 'Saving...' : 'Save changes'}
            {dirtyRegistrationIds.size > 0 && !saving ? (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary-container bg-white text-[10px] font-black text-primary-container">
                {dirtyRegistrationIds.size}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      {gridColumns.length > 6 ? (
        <div className="flex items-center gap-2">
          <Icon name="swipe_left" className="text-[18px] text-primary" />
          <p className="text-hint-xs text-on-surface-variant">
            Scroll horizontally to view every column — layout matches the Excel export
          </p>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <RegistrationManagerEmpty onRefresh={refresh} />
      ) : (
        <div className="glass-card flex flex-col overflow-hidden rounded-xl">
          <div className="manager-scrollbar max-h-[calc(100vh-280px)] overflow-auto">
            <table className="spreadsheet-grid w-full text-left">
              <thead>
                <tr>
                  {gridColumns.map((column, columnIndex) => (
                    <th
                      key={column.id}
                      style={{ minWidth: column.minWidth }}
                      className={`${headerGroupClass(column.group)} ${
                        columnIndex === 0 ? 'sticky-col sticky-col-shadow z-30' : ''
                      }`}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((row, rowIndex) => {
                  const dirty = isTeamRowDirty(row, baselineByKey.get(row.key));
                  const rejected = row.status === 'rejected';
                  const zebraClass =
                    rowIndex % 2 === 0 ? 'spreadsheet-grid-row-odd' : 'spreadsheet-grid-row-even';

                  return (
                    <tr
                      key={row.key}
                      className={`group transition-colors ${zebraClass} ${
                        dirty ? 'row-dirty' : ''
                      } ${rejected ? 'row-rejected' : ''}`}
                    >
                      {gridColumns.map((column, columnIndex) => (
                        <td
                          key={`${row.key}-${column.id}`}
                          style={{ minWidth: column.minWidth }}
                          className={columnIndex === 0 ? 'sticky-col sticky-col-shadow relative' : ''}
                        >
                          {columnIndex === 0 && dirty ? (
                            <div className="absolute top-0 bottom-0 left-0 w-1 bg-primary-container" />
                          ) : null}
                          <GridCell
                            column={column}
                            row={row}
                            showTeamName={showTeamName}
                            getParticipant={getParticipant}
                            updateTeamField={updateTeamField}
                            updateParticipantField={updateParticipantField}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-outline-variant/30 bg-surface-container-high/30 px-6 py-4">
            <span className="text-hint-xs text-on-surface-variant">
              Showing {rows.length} registered team{rows.length === 1 ? '' : 's'}
            </span>
            {dirtyRegistrationIds.size > 0 ? (
              <span className="text-label-sm text-primary">
                {dirtyRegistrationIds.size} unsaved change
                {dirtyRegistrationIds.size === 1 ? '' : 's'}
              </span>
            ) : null}
          </div>
        </div>
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

interface GridCellProps {
  column: GridColumn;
  row: TeamSpreadsheetRow;
  showTeamName: boolean;
  getParticipant: (row: TeamSpreadsheetRow, slotIndex: number) => TeamParticipant;
  updateTeamField: (
    registrationId: string,
    patch: Partial<Pick<TeamSpreadsheetRow, 'teamName' | 'status' | 'flaggedForReview'>>,
  ) => void;
  updateParticipantField: (
    registrationId: string,
    slotIndex: number,
    field: ParticipantFieldKey,
    value: string,
  ) => void;
}

function GridCell({
  column,
  row,
  showTeamName,
  getParticipant,
  updateTeamField,
  updateParticipantField,
}: GridCellProps) {
  switch (column.kind) {
    case 'teamName':
      return showTeamName ? (
        <input
          className="spreadsheet-grid-cell-input font-semibold"
          value={row.teamName}
          onChange={(event) =>
            updateTeamField(row.registrationId, { teamName: event.target.value })
          }
        />
      ) : (
        <div className="spreadsheet-grid-cell-readonly font-semibold text-on-surface">
          {row.teamName}
        </div>
      );

    case 'status':
      return (
        <select
          className={`spreadsheet-grid-cell-select font-medium capitalize ${statusSelectClass(row.status)}`}
          value={row.status}
          onChange={(event) =>
            updateTeamField(row.registrationId, {
              status: event.target.value as TeamSpreadsheetRow['status'],
            })
          }
        >
          {REGISTRATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      );

    case 'flagged':
      return (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={row.flaggedForReview}
            onChange={(event) =>
              updateTeamField(row.registrationId, {
                flaggedForReview: event.target.checked,
              })
            }
            className={`h-5 w-5 rounded border-outline-variant bg-transparent focus:ring-offset-0 ${
              row.flaggedForReview
                ? 'text-amber-500 focus:ring-amber-500/20'
                : 'text-primary focus:ring-primary/20'
            }`}
          />
        </div>
      );

    case 'participant': {
      const slotIndex = column.slotIndex!;
      const fieldKey = column.fieldKey!;
      const participant = getParticipant(row, slotIndex);

      if (fieldKey === 'currentTitle') {
        return (
          <select
            className={`spreadsheet-grid-cell-select ${
              slotIndex === 0 ? 'text-primary' : 'text-secondary'
            }`}
            value={participant.currentTitle}
            onChange={(event) =>
              updateParticipantField(row.registrationId, slotIndex, fieldKey, event.target.value)
            }
          >
            {CURRENT_TITLES.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        );
      }

      const mono = fieldKey === 'discordId' || fieldKey === 'inGameId';

      return (
        <input
          className={`spreadsheet-grid-cell-input ${mono ? 'spreadsheet-grid-cell-mono' : ''}`}
          value={participant[fieldKey]}
          onChange={(event) => {
            const value =
              fieldKey === 'discordTag'
                ? event.target.value.toLowerCase()
                : event.target.value;
            updateParticipantField(row.registrationId, slotIndex, fieldKey, value);
          }}
        />
      );
    }

    case 'createdAt':
      return (
        <div className="spreadsheet-grid-cell-readonly">{formatDisplayDate(row.createdAt)}</div>
      );

    case 'updatedAt':
      return (
        <div className="spreadsheet-grid-cell-readonly">{formatDisplayDate(row.updatedAt)}</div>
      );
  }
}

function StatChip({ dotClass, label }: { dotClass: string; label: string }) {
  return (
    <div className="stat-chip">
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      <span className="text-label-sm text-on-surface">{label}</span>
    </div>
  );
}
