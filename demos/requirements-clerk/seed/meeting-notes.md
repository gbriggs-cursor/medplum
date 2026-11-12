# Design input review

Product: {prospect} patch v2 software (fictional, not a marketed or cleared device).
Date: 2026-11-04
Attendees: software lead, QA lead. Roles only. No named people.
Synthetic: true
HTEST: true

The notes are prose. They do not assign requirement ids.

## ECG summary

Clinicians in the fictional clinic asked for the 30-second ECG summary, the one the patch already sends, to show on screen within 5 seconds of the bundle being stored. Today they wait on a spinner. QA wants that timing treated as a design input.

## High systolic reading

The clinical advisor wants a visible alert when systolic pressure from the patch is at or above 180 mmHg on two consecutive readings. There is no alert today. They asked for the behavior, not for a safety class. Classification is a different meeting.

## Verification record

QA has been writing, by hand, the software version and the commit of the ECG parser into each verification package. They want the software to record both in the evidence package for every verification run.

## Pairing failure

When pairing fails, the message should include the synthetic error code and the next step. It must not include a patient name, a date of birth, or any other patient identifier. Test data uses subject ids such as SP-014 only.

## Aside

Someone asked if the portal header can be teal. That was left as a brand remark, not a behavior of the device software.
