import { fg, inp, sel, dateInp, Sub } from './sectionUtils';

export default function EmploymentDetails({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const s = (k: string, v: string) => onChange({ ...data, [k]: v });
  return (
    <div>
      <Sub>Current Position</Sub>
      <div className="form-row form-row-2">
        {fg('Employee ID / Staff Code', inp(data.employeeId, v => s('employeeId', v)))}
        {fg('Designation *', inp(data.designation, v => s('designation', v), 'Associate Professor'))}
      </div>
      <div className="form-row form-row-2">
        {fg('Department *', inp(data.department, v => s('department', v), 'Computer Science'))}
        {fg('Institution / College Name *', inp(data.institution, v => s('institution', v)))}
      </div>
      {fg('Affiliated University', inp(data.affiliatedUniversity, v => s('affiliatedUniversity', v)))}

      <Sub>Appointment Details</Sub>
      <div className="form-row form-row-3">
        {fg('Date of Appointment', dateInp(data.dateOfAppointment, v => s('dateOfAppointment', v)))}
        {fg('Nature of Appointment', sel(data.natureOfAppointment, v => s('natureOfAppointment', v), ['Regular / Permanent', 'Ad-hoc', 'Contract', 'Guest / Visiting', 'Deputation', 'On Probation']))}
        {fg('Approval Status', sel(data.approvalOfAppointment, v => s('approvalOfAppointment', v), ['Approved', 'Pending', 'Not Applicable']))}
      </div>
      <div className="form-row form-row-2">
        {fg('Approval Letter No.', inp(data.approvalLetterNo, v => s('approvalLetterNo', v)))}
        {fg('Approval Letter Date', dateInp(data.approvalLetterDate, v => s('approvalLetterDate', v)))}
      </div>

      <Sub>Pay Details</Sub>
      <div className="form-row form-row-3">
        {fg('Pay Scale / Band', inp(data.scaleOfPay, v => s('scaleOfPay', v), 'Level-11 / AGP 8000'))}
        {fg('Current Basic Pay (₹)', inp(data.currentBasicPay, v => s('currentBasicPay', v)))}
        {fg('Date of Superannuation', dateInp(data.dateOfRetirement, v => s('dateOfRetirement', v)))}
      </div>

      <Sub>Total Experience at Current Institution</Sub>
      <div className="form-row form-row-2">
        {fg('Years', inp(data.totalExperienceYears, v => s('totalExperienceYears', v), '10'))}
        {fg('Months', inp(data.totalExperienceMonths, v => s('totalExperienceMonths', v), '6'))}
      </div>
    </div>
  );
}
