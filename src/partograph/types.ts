/**
 * Partograph data model — a WHO labour-monitoring chart.
 *
 * Every reading carries an `hour` (hours since the start of plotting, may be
 * fractional, e.g. 2.5 for a 30-minute observation) so all panels line up on
 * one shared time axis.
 */

export interface TimedValue {
  hour: number;
  value: number;
}

/** Amniotic fluid: I=intact, C=clear, M=meconium, B=blood, A=absent. */
export type AmnioticFluid = "I" | "C" | "M" | "B" | "A";

/** Moulding of the fetal skull: 0 = none, +/++/+++ increasing overlap. */
export type Moulding = "0" | "+" | "++" | "+++";

export interface Contraction {
  hour: number;
  /** Number of contractions felt per 10 minutes (0–5). */
  count: number;
  intensity: "mild" | "moderate" | "strong";
}

export interface BloodPressure {
  hour: number;
  systolic: number;
  diastolic: number;
}

export interface PartographPatient {
  name?: string;
  gravida?: string;
  para?: string;
  hospitalNo?: string;
  admittedAt?: string;
  rupturedMembranes?: string;
}

export interface PartographData {
  patient?: PartographPatient;
  /** Fetal heart rate, beats/min (plotted 80–200). */
  fetalHeartRate: TimedValue[];
  amnioticFluid: { hour: number; value: AmnioticFluid }[];
  moulding: { hour: number; value: Moulding }[];
  /** Cervical dilatation in cm, plotted with an X (the "cervicograph"). */
  cervix: TimedValue[];
  /** Descent of fetal head, 0–5, plotted with an O on the same grid. */
  descent: TimedValue[];
  contractions: Contraction[];
  pulse: TimedValue[];
  bloodPressure?: BloodPressure[];
  temperature?: TimedValue[];
  /**
   * Hour at which the Alert line begins (cervix = 4 cm). The Alert line rises
   * 1 cm/hour; the Action line runs parallel, 4 hours to its right.
   */
  alertLineStartHour?: number;
  /** Total hours to chart across the x-axis. Default 12. */
  hours?: number;
}

export interface PartographConfig extends PartographData {
  element: string | HTMLElement | HTMLCanvasElement;
}
