export type AppointmentStatus = "SCHEDULED" | "CANCELLED" | "DONE";

export interface AppointmentRow {
  id: string;
  patient_id: string;
  doctor_id: string;
  date_time: string;
  status: AppointmentStatus;
  reason: string | null;
  created_at: string;
}