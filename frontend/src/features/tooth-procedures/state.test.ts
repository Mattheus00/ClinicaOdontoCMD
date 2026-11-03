import { describe, expect, it } from 'vitest';
import { defaultStatusFor, toothName } from './constants';
import { mockAppointments, mockOdontogram, mockProcedures } from './mocks';
import {
  displayStatus,
  isExtracted,
  pickRegisterAppointment,
  recordsForTooth,
  sortTeeth,
  stateByTooth,
  toggleTooth,
} from './state';

describe('tooth selection', () => {
  it('toggles teeth in and out', () => {
    expect(toggleTooth(['11'], '21')).toEqual(['11', '21']);
    expect(toggleTooth(['11', '21'], '11')).toEqual(['21']);
  });

  it('sorts teeth in chart order', () => {
    expect(sortTeeth(['31', '11', '18', '48'])).toEqual(['18', '11', '48', '31']);
  });
});

describe('tooth state', () => {
  it('treats teeth without records as healthy', () => {
    const states = stateByTooth(mockOdontogram.teeth);
    expect(displayStatus(states.get('16'))).toBe('RESTORATION');
    expect(displayStatus(states.get('11'))).toBe('HEALTHY');
  });

  it('detects extracted teeth', () => {
    expect(isExtracted({ ...mockOdontogram.teeth[0], procedureType: 'EXTRACTION', status: 'TREATED' })).toBe(true);
    expect(isExtracted({ ...mockOdontogram.teeth[0], procedureType: 'EXTRACTION', status: 'NEEDS_TREATMENT' })).toBe(false);
    expect(isExtracted(undefined)).toBe(false);
  });

  it('lists a tooth timeline newest first', () => {
    expect(recordsForTooth(mockProcedures, '16').map((record) => record.id)).toEqual(['proc-3', 'proc-1']);
  });

  it('defaults status by procedure', () => {
    expect(defaultStatusFor('CROWN')).toBe('RESTORATION');
    expect(defaultStatusFor('ROOT_CANAL')).toBe('IN_PROGRESS');
    expect(defaultStatusFor('CLEANING')).toBe('TREATED');
  });

  it('names teeth in Portuguese', () => {
    expect(toothName('16')).toBe('Primeiro molar superior direito');
    expect(toothName('31')).toBe('Incisivo central inferior esquerdo');
    expect(toothName('75')).toBe('Segundo molar inferior esquerdo (decíduo)');
  });
});

describe('appointment for new records', () => {
  const now = new Date('2026-03-05T16:00:00-03:00');

  it('uses the requested appointment when the user can register on it', () => {
    expect(pickRegisterAppointment(mockAppointments, 'appt-2026-03', now)).toBe('appt-2026-03');
  });

  it('ignores requested appointments the user cannot register on', () => {
    expect(pickRegisterAppointment(mockAppointments, 'appt-2026-01', now)).toBe('appt-2026-03');
  });

  it('falls back to no appointment when nothing is scheduled today', () => {
    expect(pickRegisterAppointment(mockAppointments, null, new Date('2026-04-01T10:00:00-03:00'))).toBeNull();
  });
});
